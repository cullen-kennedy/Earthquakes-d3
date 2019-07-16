importScripts("../node_modules/d3/dist/d3.min.js");

onmessage = function(event) {
  var nodes = event.data.nodes
  let width = event.data.width
  let height = event.data.height
	

  	this.console.log("loading clusters")
	//hardcoded in a margin

	var simulation = d3.forceSimulation(nodes)
    		.force("collide", d3.forceCollide((d) => {
        		return 2})
    		)
    		.force("charge", d3.forceManyBody().strength(-1))
    		.force("y", d3.forceY(height/2))
    		.force("x", d3.forceX(width/2))  
			.alphaMin(0.1)
   			.stop();
		var i
  	for (i = 0, n = Math.ceil(Math.log(simulation.alphaMin()) / Math.log(1 - simulation.alphaDecay())); i < n; ++i) {
	postMessage({type: "tick", progress: i / n});
	this.console.log("tick")
    simulation.tick();
  }
  simulation.stop()
  postMessage({type: "end", nodes: nodes});

};