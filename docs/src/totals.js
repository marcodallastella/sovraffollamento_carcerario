function createLineChart() {

  let margin = {
    top: 5,
    right: 110,
    bottom: 14,
    left: 120
  };


  const chartContainer = d3.select('div#chart');
  const currentWidth = parseInt(chartContainer.style('width'), 10);
  let width = currentWidth - margin.left - margin.right;
  const height = 300 - margin.top - margin.bottom;

  let svg = chartContainer
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);

  let scaleX = d3.scaleTime()
    .range([0, width]);

  let scaleY = d3.scaleLinear()
    .domain([45000, 65000])
    .range([height, 0]);
  // Define the y-axis
  let yAxis = d3.axisLeft(scaleY).ticks(5, ',r').tickSize(-width);

  // Append the y-axis
  let yAxisGroup = svg.append("g")
    .attr("class", "y-axis")
    .call(yAxis);

  // Define the x-axis
  let xAxis = d3.axisBottom(scaleX).tickSize(-height);

  // Append the x-axis
  let xAxisGroup = svg.append("g")
    .attr("class", "x-axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis)


  let line;
  let line2;
  let data;
  let lastDataPoint;



  // Read the data
  d3.csv("https://raw.githubusercontent.com/marcodallastella/prison_overcrowding/main/outputs/viz/bollettini_mensili_totali.csv",
    // When reading the csv, I must format variables:
    function (d) {
      return { date: d3.timeParse("%Y-%m-%d")(d.dati_aggiornati_al), value: d.detenuti_totale, capacity: d.capienza_regolamentare, rate: d.tasso_affollamento }
    },
    // Now I can use this dataset:
    function (dataSet) {
      data = dataSet; // Set data to the dataSet
      // Update the last data point
      lastDataPoint = data[data.length - 1];
      scaleX = d3.scaleTime()
        .domain(d3.extent(data, function (d) { return d.date; }))
        .range([0, width]);

      // Update the x-axis scale
      xAxis.scale(scaleX);

      // Redraw the x-axis with the new scale
      xAxisGroup.call(xAxis);

      // svg.append("g")
      //   .attr("class", "x-axis")
      //   .attr("transform", "translate(0," + height + ")")
      //   .call(d3.axisBottom(scaleX));

      // Define the line function with curve interpolation
      line = d3.line()
        .x(function (d) { return scaleX(d.date); })
        .y(function (d) { return scaleY(d.value); })
        .curve(d3.curveLinear);

      // Add the total line
      svg.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", '#691A09')
        .attr("stroke-width", 1.5)
        .attr("d", line)
        .attr("class", "line-path");

      // Define the line function with curve interpolation
      line2 = d3.line()
        .x(function (d) { return scaleX(d.date); })
        .y(function (d) { return scaleY(d.capacity); })
        .curve(d3.curveLinear);

      // Add the capacity line
      svg.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", '#140eb5')
        .attr("stroke-width", 1.5)
        .attr("d", line2)
        .attr("class", "line-path2");

      // Add a circle at the end of the line
      svg.append("circle")
        .attr("id", "valueCircle")
        .attr("cx", scaleX(lastDataPoint.date))
        .attr("cy", scaleY(lastDataPoint.value))
        .attr("r", 5) // radius
        .attr("fill", "white")
        .attr("stroke", "#691A09")
        .attr("stroke-width", 1.5);

      // Add a text element for the year
      svg.append("text")
        .attr("id", "yearText")
        .attr("x", scaleX(lastDataPoint.date))
        .attr("y", scaleY(lastDataPoint.value) - 25) // position the text slightly above the circle
        .text(`${lastDataPoint.date.getFullYear()}`)
        .attr("font-size", "1.7vh")
        .attr("text-anchor", "left")
        .style("font-weight", "bold");

      // Add a text element for the value
      svg.append("text")
        .attr("id", "valueText")
        .attr("x", scaleX(lastDataPoint.date))
        .attr("y", scaleY(lastDataPoint.value) - 10) // position the text slightly above the circle
        .text(`${lastDataPoint.value.toLocaleString('en-US')}`)
        .attr("font-size", "1.7vh")
        .attr("text-anchor", "left");

      // Add a circle at the end of the capacity line
      svg.append("circle")
        .attr("id", "capacityCircle")
        .attr("cx", scaleX(lastDataPoint.date))
        .attr("cy", scaleY(lastDataPoint.capacity))
        .attr("r", 5) // radius
        .attr("fill", "white")
        .attr("stroke", "blue")
        .attr("stroke-width", 1.5);

      // Define variable for tooltip
      var div = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("background-color", "#f9f9f9")
        .style("font-size", "0.8em");

      // Add dots for totals
      svg.selectAll('dot')
        .data(data)
        .enter()
        .append('circle')
        .attr("r", 4)
        .attr("cx", function (d) {
          return scaleX(d.date)
        })
        .attr("cy", function (d) {
          return scaleY(d.value)
        })
        .attr("fill", "691A09")
        .attr("stroke", "none")
        .style("opacity", 0.2)
        .on('mouseover', function (d, i) {
          //Dot appear
          d3.select(this).transition()
            .duration('100')
            .style("opacity", 1);
          //Makes div appear
          div.transition()
            .duration('100')
            .style("opacity", 1);
          div.html("Date: " + d3.timeFormat("%Y-%m-%d")(d.date) + "<br/>" + "Inmates: " + d3.format(",")(d.value) + "<br/>" + "Regular capacity: " + d3.format(",")(d.capacity) + "<br/>" + "Overcrowding index: " + d3.format(".2f")(d.rate))
            .style("left", (d3.event.pageX + 10) + "px")
            .style("top", (d3.event.pageY - 100) + "px");
        })
        .on('mouseout', function (d, i) {
          // Dot disappear
          d3.select(this).transition()
            .duration('200')
            .style("opacity", 0.2);
          //Makes div disappear
          div.transition()
            .duration('100')
            .style("opacity", 0);
        });

      // Get most recent capacity
      let capacity = lastDataPoint.capacity;

      // Get most recent rate
      let rate = lastDataPoint.rate;
      let rate_els = document.getElementsByClassName("rate");
      for (let i = 0; i < rate_els.length; i++) {
        rate_els[i].textContent = rate;
      }

      // Calculate the difference
      let difference = lastDataPoint.value - lastDataPoint.capacity;

      // Select all elements with class "capacity" and update their text
      let capacity_els = document.getElementsByClassName("capacity");
      for (let i = 0; i < capacity_els.length; i++) {
        capacity_els[i].textContent = capacity.toLocaleString('en-US');
      }

      // Select all elements with class "difference" and update their text
      let difference_els = document.getElementsByClassName("difference");
      for (let i = 0; i < difference_els.length; i++) {
        difference_els[i].textContent = difference.toLocaleString('en-US');
      }

      let lastUpdate = new Date(lastDataPoint.date);
      let options = { year: 'numeric', month: 'long', day: 'numeric' };
      document.getElementById("lastUpdate").textContent = lastUpdate.toLocaleDateString('en-US', options);

    }
  );



  };



createLineChart()