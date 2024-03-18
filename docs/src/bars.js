// Set up SVG dimensions
const w = 500
const h = 500


// Create SVG element
const svg = d3.select("#barChart")
  .append("svg")
  .attr("width", w)
  .attr("height", h)
  .attr("x", 50)
  .style("background-color", "grey")