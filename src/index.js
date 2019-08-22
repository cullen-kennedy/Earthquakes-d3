//Description: Earthquakes during 2004 - 2011
//Author: Cullen Kennedy
/*Early Version*/
 
//Some global vars
var myMap, canvas, view = 'mapbtn', svg, x, y; 
const margin = 50, colormap = {5: "white",6: "green",7:"yellow",8:"orange",9:"red"};

window.addEventListener('load', load);

/**
 * Loads initial view and loads static map
 */
function load() 
{
    //Sets the default button as chosen
    let firstview = document.getElementById(view)
    firstview.style.backgroundColor = '#6f7070'

    //Adds event listeners to all buttons except cluster
    let toggles = document.querySelectorAll(".toggleview")
    var i;
    for (i = 0; i < toggles.length; i++) {
        toggles[i].addEventListener('click', toggleView)
    }

    // Public access key
    var key = "pk.eyJ1Ijoia2VubmUxMjUiLCJhIjoiY2p4czhsNjc2MGdjZTNtcXFsMjY1ZmRmeCJ9.4md7Cc5glRtVqmMM6tENRw";

    //load canvas vars
    canvas = document.getElementById("canvas");
    canvasContainer = document.getElementById("canvasContainer");
    ctx = canvas.getContext("2d");
  
	const mappa = new Mappa('Mapbox', key); 
    
    /**
     * Just keep it at a fixed standard size
     * Too small and the whole map won't show anyway
     */
    const options = {
        lat: 0,
        lng: 0,
        zoom: 1,
        width: 1080,
        height: 720,
        scale: 1,
        pitch: 1,
        style: 'dark-v8'
    };

    //Set map var
	myMap = mappa.staticMap(options);
    
    //Load Image
	let img = new Image();
    img.src = myMap.imgUrl;

    img.onload = () => {
        console.log(img.width + " " +img.height)
        canvasContainer.setAttribute("style", "width:" + img.width +"px;" + " height:"+img.height+"px;");
        ctx.imageSmoothingEnabled = false;
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);	

        //When image is loaded, it is time to draw svg
        setupSVG()
    }
}

/**
 * Sets up the svg element over the canvas/map as well as the chart axis elements
 */    
function setupSVG() {
    //Change this to easier change the domains
    let beginDate = new Date("01/01/2004")
    let endDate = new Date("12/31/2011")

    //Domains are hardcoded
    svg = d3.select(canvasContainer).append('svg')

    //Setting the chart element
    let chartview = svg.append("g")
                .attr("class", "charts")
                .attr("height", canvas.height)
                .attr("width", canvas.width)
                .attr("transform", 
                "translate(" + margin + "," + 0 + ")")

    //x and y, used in update have global scope
    x = d3.scaleTime()
        .range([margin,canvas.width-margin])
        .domain([beginDate,endDate])
        
    y = d3.scaleLinear()
        .domain([0,4520])
        .range([canvas.height-margin,margin])
                
    //Setting the chart axis graphics
    let chartx = chartview.append("g")
        .attr("class", "x axis")
        .style('opacity', 0)
        .style("fill", "white")
        .style("stroke-width", 1)
      
    let charty = chartview.append("g")
        .attr("class", "y axis")
        .style('opacity', 0)
        .style("fill", "white")
        .style("stroke-width", 1)

    let xAxis = d3.axisBottom(x)
    let yAxis = d3.axisRight(y)

    chartx
        .attr("transform", "translate(" + -margin + "," + (canvas.height - margin) + ")")
        .call(xAxis)

    charty
        .attr("transform", "translate(" + 0 + "," + 0 + ")")
        .call(yAxis)    
   
    addPoints()
}

/**
 * loads the data
 */
function addPoints()
{
    d3.csv('./csv/newFile.csv')
        .then((data) => {
            draw(data)
        })
        .catch((error) => {
            console.log("Error Loading Data:" + error)
        })
}

/**
 * Draws the actual circles on the map and runs the worker
 * who sets the cluster positions
 * @param data 
 */
function draw(data) {

    let meter = document.querySelector("#progress")
			
	let worker = new Worker("src/worker.js");
	
		svg.selectAll('circle')
		.data(data)
		.enter()
		.append("circle")
    	.attr("r", function(d) {return Math.floor(d['Magnitude'] - 4)})
        .attr('fill', function(d) {return colormap[Math.floor(d['Magnitude'])]})
        .attr('opacity', 0.6)
    	.attr('class', function(d) {
            return Math.floor(d['Magnitude']);
        })

    //Sending the wrong canvas dimensions sometimes
	worker.postMessage({
	    nodes: data,
        width: canvas.getAttribute('width'),
        height: canvas.getAttribute('height')
	});

	worker.onmessage = function(event) {
	  switch (event.data.type) {
	    case "tick": return ticked(event.data);
	    case "end": return ended(event.data);
	  }
	};

	function ticked(data) {
        var progress = data.progress;
        meter.style.width = 90 * progress + "%";
	}

	function ended(data) {
        var nodes = data.nodes
        var cluster = document.getElementById("cluster")
        cluster.addEventListener("click", toggleView);
        cluster.setAttribute("class", "b-ready buttons toggleview hover")
		
		//Let circles remember their x and y cluster values
		//Won't be very good if I need x or y later, but unlikely.
		//Maybe find alternative
		svg.selectAll('circle').data(nodes)
	
	}
    update();

}

/**
 * Update sets mapview, chartview, play view or cluster view 
 * @param transitionTime 
 */
function update(transitionTime) {   

    transitionTime = (typeof transitionTime !== 'undefined') ? transitionTime : 0

    if (view === 'mapbtn') {

        axisOpacity(2, 0)
        svg.selectAll("circle").each(function(d) {
           
            circle = d3.select(this)

			let pos = myMap.latLngToPixel(d['Latitude'], d['Longitude']);

            circle
                .transition()
                .duration(transitionTime)
                .attr("cx", pos.x )
                .attr("cy", pos.y )
        }) 
    }
    else if (view === 'play'){
 
        axisOpacity(2, 0)

        svg.selectAll('circle')
            .transition()
            .duration(0)
            .attr("r",0)
            
        var dateshow = document.createElement("div")
            canvasContainer.appendChild(dateshow)
            dateshow.setAttribute("id", "dateshow");

        svg.selectAll("circle").each(function(d, i) {
            circle = d3.select(this)
            let pos = myMap.latLngToPixel(d['Latitude'], d['Longitude']);

            setTimeout(() => { dateshow.innerHTML = d['Date'] }, i*10);

            //basically a delayed transition of radius from 0 to showing to 0 (size and duration depends on magnitude)
            circle
                .attr("cx", pos.x)
                .attr("cy", pos.y)
                .transition()
                .duration((d) => {return Math.pow(Math.floor((d['Magnitude'])), 3.5)})
                .delay(10*i)
                .attr("r", function(d) {return Math.pow(Math.floor((d['Magnitude'] - 4)), 3)})
                .transition()
                .duration((d) => {return Math.pow(Math.floor((d['Magnitude'])), 3.5)})
                .attr("r",0)   
        })
      
    } 
    //Chart view is simply time / frequency
    else if (view === 'chart') {

        axisOpacity(2, 1)

        let v = 0;    
            svg.selectAll('circle')
                .transition()
                .duration(transitionTime)
                .attr('cy', () => {return y(v++);})
                .attr('cx', (d, i) => {
                    return x(new Date(d['Date']))
                })     
    }  
    //Cluster View is setting cx, cy to d.x and d.y previously determined by the worker
    else if (view === 'cluster') {
		
        axisOpacity(2, 0);
	
        svg.selectAll('circle')
            .transition()
            .duration(transitionTime)
			.attr("cx", function(d) { return d.x; })
      		.attr("cy", function(d) { return d.y; })
    }	

    /**
     * Add Depth View maybe
     * */							 	
}

function toggleView() {
    
    //reset colour and hover of last button
    let lastbtn = document.getElementById(view)
    lastbtn.style.backgroundColor = 'black'
    lastbtn.setAttribute("class", "b-ready buttons toggleview hover")

    //If view was play, stop the delayed transitions, reset radius and visibility
    if (view === 'play') {

        let dateshow = document.getElementById("dateshow")
        canvasContainer.removeChild(dateshow)

        svg.selectAll("circle")
        .each(function() {
            d3.select(this)
                .transition()
                .duration(0)
                .attr("r", function(d) {return Math.floor(d['Magnitude'] - 4)})
                .attr('visibility', 'visible')       
        })
    }

    view = event.target.id
    //set color and activive on selected button
    let currentbtn = document.getElementById(view)
    currentbtn.style.backgroundColor = '#6f7070'
    currentbtn.setAttribute("class", "b-ready buttons toggleview")

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
    //Was previously for other axis views. Not using this else condition
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



    
  
