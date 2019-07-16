//Description: Map of US naval losses during WWII
//Author: Cullen Kennedy
/*Early Version*/
 

//Clean these UP Somehow!
var myMap, canvas, view = 'mapbtn'
var x, y
var svg, chartview, chartx, charty; 
const margin = 50;
const colormap = {5: "blue",6: "green",7:"yellow",8:"orange",9:"red"}

         
window.addEventListener('load', load);

function load() 
{
    //Sets the default button as chosen
    let firstview = document.getElementById(view)
    firstview.style.backgroundColor = '#6f7070'

    //Adds event listeners to all buttons except cluster
    x = document.querySelectorAll(".toggleview")
    var i;
    for (i = 0; i < x.length; i++) {
        x[i].addEventListener('click', toggleView)
    }

    // Public access key
    var key = "pk.eyJ1Ijoia2VubmUxMjUiLCJhIjoiY2p4czhsNjc2MGdjZTNtcXFsMjY1ZmRmeCJ9.4md7Cc5glRtVqmMM6tENRw";

    //load canvas vars
    canvas = document.getElementById("canvas");
    canvasContainer = document.getElementById("canvasContainer");
    ctx = canvas.getContext("2d");
  
	const mappa = new Mappa('Mapbox', key); 
	
    /**
     * Options for map screen dimensions and letting mapbox 
     * set the max allowable works for now - a little hacky
     */
    const options = {
        lat: 0,
        lng: 0,
        zoom: 1,
        width: window.screen.availWidth * 0.90,
        height: window.screen.availHeight * 0.90,
        scale: 1,
        pitch: 1,
        style: 'light-v8'
    };

    //Set map var
	myMap = mappa.staticMap(options);
    
    //Load Image
	let img = new Image();
    img.src = myMap.imgUrl;

    //Set Canvas and canvas container to images dimensions
    img.onload = () => {
        canvasContainer.setAttribute("style", "width:" + img.width +"px;" + " height:"+img.height+"px;");
		canvas.width = img.width;
        canvas.height = img.height;
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, 0, 0);	
    }

    svg = d3.select(canvasContainer).append('svg')

    //Change to domain
    let beginDate = new Date("01/02/2000")
    let endDate = new Date("12/30/2016")

    //Setting chart scales, x and y are global
    //Linear scale is incorrect. Will be changed anyway
    x = d3.scaleTime()
    .domain([beginDate,endDate])
    y = d3.scaleLinear()
    .domain([0,8800])

    //Setting the chart element
    chartview = svg.append("g")
                .attr("class", "charts")
                .attr("height", canvas.height)
                .attr("width", canvas.width)
                .attr("transform", 
                "translate(" + margin + "," + 0 + ")")
                
    //Setting the chart axis graphics
    chartx = chartview.append("g")
        .attr("class", "x axis")
        .style('opacity', 0)
      
    charty = chartview.append("g")
        .attr("class", "y axis")
        .style('opacity', 0)
   
   	addPoints();
}

function addPoints()
{
    d3.csv('./csv/database.csv')
        .then((data) => {
            draw(data)
        })
        .catch((error) => {
            console.log("Error Loading Data:" + error)
        })
}


function draw(data) {

    let meter = document.querySelector("#progress")
			
	let worker = new Worker("src/worker.js");
	
		svg.selectAll('circle')
		.data(data)
		.enter()
		.append("circle")
    	.attr("r", function(d) {return Math.floor(d['Magnitude'] - 4)})
    	.attr('fill', function(d) {return colormap[Math.floor(d['Magnitude'])]})
    	.attr('class', function(d) {
        return Math.floor(d['Magnitude']);
    })

	worker.postMessage({
	    nodes: data,
        width: canvas.width,	
        height: canvas.height
	});

	worker.onmessage = function(event) {
	  switch (event.data.type) {
	    case "tick": return ticked(event.data);
	    case "end": return ended(event.data);
	  }
	};

	function ticked(data) {
        var progress = data.progress;

        meter.style.width = 100 * progress + "%";
	}

	function ended(data) {
        var nodes = data.nodes
        var cluster = document.getElementById("cluster")
        cluster.addEventListener("click", toggleView);
		
		//Let circles remember their x and y cluster values
		//Won't be very good if I need x or y later, but unlikely.
		//Maybe find alternative
		svg.selectAll('circle')
		.data(nodes)
	
	}
    update();

}

function update(transitionTime) {   

    transitionTime = (typeof transitionTime !== 'undefined') ? transitionTime : 0

    if (view === 'mapbtn') {


        axisOpacity(2, 0)

        svg.selectAll("circle")
        .each(function(d) {

            circle = d3.select(this)
            lost = -110
			
			let pos = myMap.latLngToPixel(d['Latitude'], d['Longitude']);
			
            circle
            .attr('visibility', 'visible')
            .transition()
            .duration(transitionTime)
            .attr("cx", pos.x )
            .attr("cy", pos.y )
               
          
        }) 
    }
    else if (view === 'play'){
        /**
         * Need to add timeline
         */
        axisOpacity(2, 0)

        svg.selectAll('circle')
            .transition()
            .duration(transitionTime)
            .attr('visibility', 'hidden')
            

        svg.selectAll("circle").each(function(d, i) {
            circle = d3.select(this)
			let pos = myMap.latLngToPixel(d['Latitude'], d['Longitude']);

            circle
            .attr("cx", pos.x)
            .attr("cy", pos.y)
            .transition()
            .delay(50*i)
            .attr('visibility', 'visible')

        })
      
    } 

    else if (view === 'chart') {
        /**
         * Needs improvement. A linear chart isn't very interesting
         * Although the sharp increase after mag 9s is
         */
        x.range([margin,canvas.width-margin])
        y.range([canvas.height-margin,margin])

        let xAxis = d3.axisBottom(x)
        let yAxis = d3.axisRight(y)

        chartx
            .attr("transform", "translate(" + -margin + "," + (canvas.height - margin) + ")")
            .call(xAxis)

        charty
            .attr("transform", "translate(" + 0 + "," + 0 + ")")
            .call(yAxis)

        axisOpacity(2, 1)

        let v = 0;    
            svg.selectAll('circle')
                .attr('visibility', 'visible')
                .transition()
                .duration(transitionTime)
                .attr('cy', () => {return y(v++);})
                .attr('cx', (d, i) => {
                    return x(new Date(d['Date']))
                })
        v = 0;      
    }  
    else if (view === 'cluster') {
		
        axisOpacity(2, 0);

				
        svg.selectAll('circle')
            .attr('visibility', 'visible')
            .transition()
            .duration(transitionTime)
			.attr("cx", function(d) { return d.x; })
      		.attr("cy", function(d) { return d.y; })
    }	

    /**
     * Add View Depth 
     * */	
						 	
}

function toggleView() {
   let lastbtn = document.getElementById(view)
    lastbtn.style.backgroundColor = 'rgba(0,0,0,0.4)'
    view = event.target.id
    let currentbtn = document.getElementById(view)
    currentbtn.style.backgroundColor = '#6f7070'
    showView();
}

function showView() {
    if (view == "mapbtn") {
        showMap()
    }
    else if (view =="play") {
        showMap()  
    }
    else if (view == "chart"){
        hideMap()
    }  
    else if (view == "cluster") {
        hideMap()
    }
    update(500)        
}


function showMap() {
    mapOpacity(1);
}

function hideMap() {
    mapOpacity(0.5);
}


function mapOpacity(opacity) {
    canvas.style.opacity = opacity;
  
}

function axisOpacity(axis, val) {
    if(axis == 2){
        d3.selectAll(".axis")
        .transition()
        .duration(500)
        .style("opacity", val);
    }
    else{
        d3.selectAll(".y")
        .transition()
        .duration(500)
        .style("opacity", val)

        d3.selectAll(".x")
        .transition()
        .duration(500)
        .style("opacity", 1)

    }
}



    
  
