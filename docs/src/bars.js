// Set up SVG dimensions
const w = 1000;
const h = 500;
const margin = {top: 5, right: 30, bottom: 40, left: 140};
const padding = 30;



// Parse the data
d3.csv('https://raw.githubusercontent.com/marcodallastella/prison_overcrowding/main/outputs/viz/top10.csv', function (dataset) {

const svg = d3.select("#barChart")
            .append("svg")
            .attr("width", w)
            .attr("height", h)
            .style("background-color", "white")


// Add X scale
const xScale = d3.scaleLinear()
  .domain([0, d3.max(dataset, (d) => +d.totale_detenuti)])
  .range([margin.left + padding, w - margin.right - padding]);


// Add Y scale
const yScale = d3.scaleBand()
  .domain(dataset.map(function (d) { return d.institute_name; }).reverse())
  .range([h - padding, padding])
  .padding(0.5)


  // Create SVG element
const xAxis = d3.axisBottom(xScale).tickSize(0);
const yAxis = d3.axisLeft(yScale).tickSize(0);

// Adding axes
svg.append("g")
  .attr("transform", "translate(0," + (h - padding) + ")")
  .call(xAxis)
  .selectAll("text")
  .style("font-size", "1.3em");
svg.append("g")
  .attr("transform", "translate(" + (margin.left + padding) + ",0)")
  .call(yAxis)
  .selectAll("text")
  .style("font-size", "1.3em")


// Bars for total of inmates
svg.selectAll("inmatesTotal")
  .data(dataset)
  .enter()
  .append("rect")
  .attr("x", xScale(0))
  .attr("y", function(d) { return yScale(d.institute_name); })
  .attr("width", function(d) { return xScale(d.totale_detenuti) - (margin.left + padding); })
  .attr("height", yScale.bandwidth())
  .attr("fill", "#691A09")

// Bars for real capacity
svg.selectAll("capacityReal")
  .data(dataset)
  .enter()
  .append("rect")
  .attr("x", xScale(0))
  .attr("y", function(d) { return yScale(d.institute_name); })
  .attr("width", function(d) { return xScale(d.posti_effettivi) - (margin.left + padding); })
  .attr("height", yScale.bandwidth())
  .attr("fill", "#140eb5")

// Adding rate text
svg.selectAll(".barRates")
  .data(dataset)
  .enter()
  .append("text")
  .attr("class", "barText")
  .attr("x", (d) => xScale(d.totale_detenuti) + 5)
  .attr("y",  (d) => yScale(d.institute_name) + yScale.bandwidth() / 2 + 4)
  .text((d) => d.rate)
  .attr("fill", "black")
  .attr("font-size", "0.9em");


// Adding total inmates text
svg.selectAll(".totalInmatesText")
  .data(dataset)
  .enter()
  .append("text")
  .attr("class", "totalInmatesText")
  .attr("x", (d) => xScale(d.totale_detenuti) -5)
  .attr("y",  (d) => yScale(d.institute_name) + yScale.bandwidth() / 2 + 4)
  .text((d) => d.totale_detenuti)
  .attr("fill", "white")
  .attr("font-size", "0.9em")
  .attr("text-anchor", "end")
  .attr("fill", "#691A09")

// Adding total inmates text
svg.selectAll(".totalInmatesText")
  .data(dataset)
  .enter()
  .append("text")
  .attr("class", "totalInmatesText")
  .attr("x", (d) => xScale(d.totale_detenuti) -5)
  .attr("y",  (d) => yScale(d.institute_name) + yScale.bandwidth() / 2 + 4)
  .text((d) => d.totale_detenuti)
  .attr("fill", "white")
  .attr("font-size", "0.9em")
  .attr("text-anchor", "end")

// X-axis label
svg.append("text")
  .attr("transform", "translate(" + (w - margin.right - padding) + " ," + (h - margin.bottom) +")")
  .style("text-anchor", "end")
  .text("Total Inmates");


  const firstDataPoint = dataset[0];
  

document.getElementById("topPrisonName").textContent = firstDataPoint.institute_name;
document.getElementById("topPrisonTasso").textContent = firstDataPoint.rate;


  });
