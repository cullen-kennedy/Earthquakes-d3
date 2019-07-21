//Description: Map of US naval losses during WWII
//Author: Cullen Kennedy
/*Early Version*/
 

//Clean these UP Somehow!
var myMap, canvas, view = 'mapbtn'
var x, y
var svg, chartview, chartx, charty; 
const margin = 50;
const colormap = {5: "white",6: "green",7:"yellow",8:"orange",9:"red"}

         
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
     * Need to fix for mobile
     */

    var screenwidth = Math.floor(window.screen.availWidth * 0.90)
    var screenheight = Math.floor(window.screen.availHeight * 0.90)

    const options = {
        lat: 0,
        lng: 0,
        zoom: 1,
        width: (screenwidth > 1280) ? 1280 : screenwidth,
        height: (screenheight > 1280) ? 1280 : screenheight,
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
        addPoints();
    }


    svg = d3.select(canvasContainer).append('svg')

    //Change this to easier change the domains
    let beginDate = new Date("01/01/2004")
    let endDate = new Date("12/31/2011")

    //Setting chart scales, x and y are global
    //Linear scale is incorrect. Will be changed anyway
    x = d3.scaleTime()
    .domain([beginDate,endDate])
    y = d3.scaleLinear()
    .domain([0,4519])

    //Setting the chart element
    chartview = svg.append("g")
                .attr("class", "charts")
                .attr("height", canvas.height)
                .attr("width", canvas.width)
                .attr("transform", 
                "translate(" + margin + "," + 0 + ")")
                
    //Setting the chart axis graphics
    //Fill doesn't change the text color
    chartx = chartview.append("g")
        .attr("class", "x axis")
        .style('opacity', 0)
        .style("fill", "white")
        .style("stroke-width", 1)
      
    charty = chartview.append("g")
        .attr("class", "y axis")
        .style('opacity', 0)
        .style("fill", "white")
        .style("stroke-width", 1)
   
  
}

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
            .attr("r", function(d) {return Math.floor(d['Magnitude'] - 4)})
            .attr("cx", pos.x )
            .attr("cy", pos.y )
               
          
        }) 
    }
    else if (view === 'play'){
 
        axisOpacity(2, 0)

        svg.selectAll('circle')
            .transition()
            .duration(transitionTime)
            .attr('visibility', 'hidden')
            
        var dateshow = document.createElement("div")
        canvasContainer.appendChild(dateshow)
        dateshow.setAttribute("id", "dateshow");

        svg.selectAll("circle").each(function(d, i) {
            circle = d3.select(this)
            let pos = myMap.latLngToPixel(d['Latitude'], d['Longitude']);

           /**
            * Replace this timeout with just months and years
            *  */ 
            setTimeout(() => { dateshow.innerHTML = d['Date'] }, i*10);
         
            circle
            .attr("cx", pos.x)
            .attr("cy", pos.y)
            .transition()
            .duration((d) => {return Math.pow(Math.floor((d['Magnitude'])), 3.5)})
            .delay(10*i)
            .attr("r", function(d) {return Math.pow(Math.floor((d['Magnitude'] - 4)), 3)})
            .attr('visibility', 'visible')
            .transition()
            .duration((d) => {return Math.pow(Math.floor((d['Magnitude'])), 3.5)})
            .attr("r",0)
            .transition()
            .attr('visibility', 'hidden')

           


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
                .attr("r", function(d) {return Math.floor(d['Magnitude'] - 4)})
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
            .attr("r", function(d) {return Math.floor(d['Magnitude'] - 4)})
			.attr("cx", function(d) { return d.x; })
      		.attr("cy", function(d) { return d.y; })
    }	

    /**
     * Add View Depth 
     * */	
						 	
}

function toggleView() {
    let lastbtn = document.getElementById(view)
    lastbtn.style.backgroundColor = 'black'
    lastbtn.setAttribute("class", "b-ready buttons toggleview hover")

    if (view === 'play') {
        let dateshow = document.getElementById("dateshow")
        canvasContainer.removeChild(dateshow)
    }

    view = event.target.id

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



    
  
