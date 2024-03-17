function createBarChart() {


  let margin = {
    top: 20,
    right: 20,
    bottom: 20,
    left: 20
  };


  const chartContainer = d3.select('div#squares');
  const currentWidth = parseInt(chartContainer.style('width'), 10);
  let width = currentWidth - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;


  const myChart = d3
    .select('div#squares')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .attr('transform', `translate(${margin.left}, ${margin.top})`);


  // Read the data
  d3.csv("https://raw.githubusercontent.com/marcodallastella/prison_overcrowding/main/outputs/viz/istituti_totali.csv",

    // When reading the csv, I must format variables:
    function (d) {
      return { date: d3.timeParse("%d/%m/%Y")(d.dati_aggiornati_al), value: +d.totale_detenuti, capacityOfficial: +d.posti_regolamentari, capacityReal: +d.posti_reali, rateReal: +d.tasso_reale }
    },

    // Now I can use this dataset:
    function (dataSet) {
      data = dataSet; // Set data to the dataSet

      // Update the last data point
      lastDataPoint = data[data.length - 1];

      // Get most recent dateReal
      let dateReal = lastDataPoint.date;
      let dateReal_els = document.getElementsByClassName("date_real");
      for (let i = 0; i < dateReal_els.length; i++) {
        dateReal_els[i].textContent = dateReal.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      }


      // Get most recent capacityReal
      let capacityReal = lastDataPoint.capacityReal;
      let capacityReal_els = document.getElementsByClassName("capacity_real");
      for (let i = 0; i < capacityReal_els.length; i++) {
        capacityReal_els[i].textContent = capacityReal.toLocaleString();
      }

      // Get most recent capacityOfficial
      let capacityOfficial = lastDataPoint.capacityOfficial;
      let capacityOfficial_els = document.getElementsByClassName("capacity_official");
      for (let i = 0; i < capacityOfficial_els.length; i++) {
        capacityOfficial_els[i].textContent = capacityOfficial.toLocaleString();
      }


      // Calculate the difference between capacityOfficial and capacityReal and send it to class "difference_institutes"
      let difference = capacityOfficial - capacityReal;
      let difference_els = document.getElementsByClassName("difference_institutes");
      for (let i = 0; i < difference_els.length; i++) {
        difference_els[i].textContent = difference.toLocaleString();
      }

      // Get ratio
      let ratio = Math.round(capacityOfficial / difference);
      let ratio_els = document.getElementsByClassName("ratio");
      for (let i = 0; i < ratio_els.length; i++) {
        ratio_els[i].textContent = ratio.toLocaleString();
      }

      // Create squares
      let blueSquares = Math.round(capacityOfficial / 100);
      let redSquares = Math.round(difference / 100);
      let totalSquares = redSquares + blueSquares

      // Define the size of the squares and the number of squares per row
      let squareSize = 15;
      let squaresPerRow = 30;
      let gap = 2;
      let cornerRadius = 2

      let squares = [];

      // Create blue squares
      for (let i = 0; i < totalSquares; i++) {
        let square = myChart.append('rect')
          .attr('x', (i % squaresPerRow) * (squareSize + gap))
          .attr('y', Math.floor(i / squaresPerRow) * (squareSize + gap))
          .attr('width', squareSize)
          .attr('height', squareSize)
          .attr('rx', cornerRadius)
          .attr('ry', cornerRadius)
          .attr('fill', 'grey');
        squares.push(square);
      }

      // Randomly select redSquares number of squares and change their color to red
      for (let i = 0; i < redSquares; i++) {
        let randomIndex = Math.floor(Math.random() * squares.length);
        squares[randomIndex].attr('fill', '#691A09');
        squares.splice(randomIndex, 1); // Remove the selected square from the array so it can't be selected again
      }

      // Add text to the chart
      myChart.append('text')
        .attr('x', 0)
        .attr('y', height)
        .text('Each square represents about 100 spots.') // Change this to adjust the text
        .attr('font-family', 'sans-serif')
        .attr('font-size', '1.7vh')
        .attr('fill', 'black');


      let legendData = [
        { color: 'grey', text: 'Available' },
        { color: '#691A09', text: 'Not available' }
      ];

      // Create the legend
      let legend = myChart.selectAll('.legend')
        .data(legendData)
        .enter()
        .append('g')
        .attr('class', 'legend')
        .attr('transform', function (d, i) { return 'translate(0,' + (height - 20 * legendData.length + i * 20) + ')'; });


      // Add the squares to the legend
      legend.append('rect')
        .attr('x', width - 18)
        .attr('width', 18)
        .attr('height', 18)
        .style('fill', d => d.color);

      // Add the explanations to the legend
      legend.append('text')
        .attr('x', width - 24)
        .attr('y', 10) // Change this to adjust the y position of the text
        .attr('dy', '.35em')
        .style('text-anchor', 'end')
        .text(d => d.text);
    }
  )

}

createBarChart()