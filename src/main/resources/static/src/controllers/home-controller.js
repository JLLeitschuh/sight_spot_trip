(function(){
    'use strict';

    angular.module('app').controller('homeController', function ($scope, cytoData, $http, $timeout, utils){
        $scope.defaults = {
            zoomingEnabled: true,
            userPanningEnabled: true
        };
        $scope.styles = [
            {
                selector: 'node',
                style:{
                   content: 'data(nodeId)'
                }
            },
            {
                selector: 'edge',
                style:{
                   content: 'data(relationId)',
                }
            },
            {
                selector: '.highlighted',
                style:{
                    'background-color': '#61bffc',
                    'width ': '5px',
                    'line-color': '#61bffc',
                    'target-arrow-color': '#61bffc',
                    'transition-property': 'background-color, line-color, target-arrow-color',
                    'transition-duration': '0.5s'
                }
            },
            
            {
                selector: '.node-nodeId',
                style:{
                   content: 'data(nodeId)',
                }
            },
            {
                selector: '.node-label',
                style:{
                   content: 'data(label)',
                }
            },
            {
                selector: '.node-description',
                style:{
                   content: 'data(description)',
                }
            },
            {
                selector: '.edge-relationId',
                style:{
                   content: 'data(relationId)',
                }
            },
            {
                selector: '.edge-label',
                style:{
                   content: 'data(label)',
                }
            },
            {
                selector: '.edge-description',
                style:{
                   content: 'data(description)',
                }
            },
            {
                selector: '.edge-distance',
                style:{
                   content: 'data(distance)',
                }
            },
            {
                selector: '.edge-time',
                style:{
                   content: 'data(time)',
                }
            },
            {
                selector: '.edge-cost',
                style:{
                   content: 'data(cost)',
                }
            },
        ];

        $scope.elements = [];
        
        var nodes, edges, elements = [];
        $http.get("/api/nodes").then(function (response) {
            $scope.nodes = nodes = response.data;
            $scope.startNode = nodes[0];
            $scope.endNode = nodes[4];
            
            $http.get("/api/edges").then(function (response) {
            	$scope.edges = edges = response.data;
            	
                for(var i = 0; i < nodes.length; i++) {
                	var node = nodes[i];
                	elements.push({ group:'nodes',data: node });
                }
                for(var i = 0; i < edges.length; i++) {
                	var edge = edges[i];
                	elements.push({ group:'edges',data: angular.extend(edge, {source: edge.node1.id, target: edge.node2.id})});
                }
                console.info(elements);
                $scope.elements = elements;
                cytoData.getGraph('default').then(function(graph){
                    $scope.graph = graph;
                    $scope.graph.center();
                });
                $timeout(function() {
                    $scope.layout = {name:'circle'};
                }, 0);
            });
        });
        
        $http.get("/api/busNames").then(function (response) {
        	$scope.buses = response.data;
        	$scope.bus = $scope.buses[0];
        });
        
        $scope.searchBus = function() {
        	var queryString = utils.encodeQueryData({busName: $scope.bus});
        	$http.get("/api/bus?" + queryString).then(function (response) {
                if(response.data) {
                	$scope.pathNodes = response.data.nodes;
                	$scope.pathEdges = response.data.edges;
                	var displayPath = $scope.pathNodes.map(function(node) {
                		return node.properties.nodeId;
                	}).join("->");
                	$scope.result = "搜索到的公交线路是：" + displayPath + ", 路程是： " + response.data.totalWeight;
                }
                else {
                	$scope.result = "没有查询到公交线路";
                }
        	});
        };
        

        $scope.nodes = [];
        $scope.edges = [];
        $scope.choices = [
        	{name: "distance", description: "距离优先"},
        	{name: "time", description: "时间优先"},
        	{name: "cost", description: "费用优先"},
        	{name: "mix", description: "混合"},
        ];
        $scope.choice = $scope.choices[0];
        $scope.weights = [
        	{name: "1", value: 1},
        	{name: "2", value: 2},
        	{name: "3", value: 3},
        ];
        $scope.distanceWeight = $scope.weights[0];
        $scope.timeWeight = $scope.weights[0];
        $scope.costWeight = $scope.weights[0];
        
        $scope.search = function() {
        	var node1Id = $scope.startNode.nodeId;
        	var node2Id = $scope.endNode.nodeId;
        	var choice = $scope.choice.name;
        	var totalWeight = $scope.distanceWeight.value + $scope.timeWeight.value + $scope.costWeight.value;
        	var distanceWeight = $scope.distanceWeight.value * 1.0 / totalWeight;
        	var timeWeight = $scope.timeWeight.value * 1.0 / totalWeight;
        	var costWeight = $scope.costWeight.value * 1.0 / totalWeight;
        	var queryString = utils.encodeQueryData({node1Id: node1Id, node2Id: node2Id, weight: choice, distanceWeight: distanceWeight, timeWeight: timeWeight, costWeight: costWeight});
        	$http.get("/api/shortestpath?" + queryString).then(function (response) {
                console.info(response);
                if(response.data) {
                	$scope.pathNodes = response.data.nodes;
                	$scope.pathEdges = response.data.edges;
                	var displayPath = $scope.pathNodes.map(function(node) {
                		return node.properties.nodeId;
                	}).join("->");
                	$scope.result = "搜索到的最佳路径是：" + displayPath + ", 代价是： " + response.data.totalWeight;
                }
                else {
                	$scope.result = "没有查询到最短路劲";
                }
        	});
        };
        
        var highlightedEdges;
        $scope.animate_highlight = function() {
            $timeout(function() {
                //var bfs = $scope.graph.elements().bfs('#' + $scope.graph.elements()[0].id(), function(){}, true);
            	var shortestPathEdges = $scope.pathEdges.map(function(edge) {
            		return edge.id;
            	}).map(function(id) {
            		return $scope.graph.getElementById(id);
            	});
            	var shortestPathNodes = $scope.pathNodes.map(function(node) {
            		return node.id;
            	}).map(function(id) {
            		return $scope.graph.getElementById(id);
            	});
            	highlightedEdges = shortestPathEdges;
            	
            	var shortestPathElements = [];
            	for (var i = 0; i < shortestPathNodes.length - 1; i++) {
            		shortestPathElements.push(shortestPathNodes[i]);
            		shortestPathElements.push(shortestPathEdges[i]);
            	}
        		shortestPathElements.push(shortestPathNodes[shortestPathNodes.length - 1]);
            	
            	for (var i = 1; i <= shortestPathElements.length; i++) {
            	    (function(index, shortestPathElements) {
            	        setTimeout(function() {
            	        	shortestPathElements[index - 1].addClass('highlighted');
            	        }, index * 500);
            	    })(i, shortestPathElements);
            	}
            }, 100);
        };
        
        $scope.reset = function() {
//        	for(var i = 0; i < highlightedEdges.length; i++) {
//        		highlightedEdges[i].removeClass('highlighted');
//        	}
        	var allEdges = $scope.graph.edges();
        	for(var i = 0; i < allEdges.length; i++) {
        		allEdges[i].removeClass('highlighted');
        	}
        	var allNodes = $scope.graph.nodes();
        	for(var i = 0; i < allNodes.length; i++) {
        		allNodes[i].removeClass('highlighted');
        	}
        };

        $scope.selected_element = null;
        $scope.$on('cy:node:click', function(ng,cy){
        	$scope.selected_element = angular.extend(angular.extend({}, cy.cyTarget.attr()),{isNode: cy.cyTarget.isNode(), isEdge: cy.cyTarget.isEdge()});
            $scope.$apply();
        });
        $scope.$on('cy:edge:click', function(ng,cy){
        	$scope.selected_element = angular.extend(angular.extend({}, cy.cyTarget.attr()),{isNode: cy.cyTarget.isNode(), isEdge: cy.cyTarget.isEdge()});
            $scope.$apply();
        });
        
        $scope.nodeAttributes = [
        	{name: "nodeId", value: "节点ID"},
        	{name: "label", value: "节点标签"},
        	{name: "description", value: "节点描述"},
        ];
        $scope.edgeAttributes = [
        	{name: "relationId", value: "边ID"},
        	{name: "label", value: "边标签"},
        	{name: "description", value: "边描述"},
        	{name: "distance", value: "边距离"},
        	{name: "time", value: "时间"},
        	{name: "cost", value: "费用"},
        ];
        $scope.nodeAttribute = $scope.nodeAttributes[0];
        $scope.edgeAttribute = $scope.edgeAttributes[0];
        
        var lastNodeContentStyle = 'node-nodeId';
        var lastEdgeContentStyle = 'edge-relationId';
        $scope.node_display_attr_update = function() {
        	var allNodes = $scope.graph.nodes();
        	for(var i = 0; i < allNodes.length; i++) {
        		allNodes[i].removeClass(lastNodeContentStyle);
        		allNodes[i].addClass('node-' + $scope.nodeAttribute.name);
        		lastNodeContentStyle = 'node-' + $scope.nodeAttribute.name;
        	}
        };
        $scope.edge_display_attr_update = function() {
        	var allEdges = $scope.graph.edges();
        	for(var i = 0; i < allEdges.length; i++) {
        		allEdges[i].removeClass(lastEdgeContentStyle);
        		allEdges[i].addClass('edge-' + $scope.edgeAttribute.name);
        		lastEdgeContentStyle = 'edge-' + $scope.edgeAttribute.name;
        	}
        };
        
        
        
    });
  
    
})();