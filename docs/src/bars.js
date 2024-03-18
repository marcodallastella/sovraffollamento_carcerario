let scaleX;
let bars;
let topTenPrisons; // Define topTenPrisons in the outer scope

function createBarChart() {
  let margin = {
    top: 10,
    right: 10,
    bottom: 10,
    left: 170
  };

  const chartContainer = d3.select('div#barChart');
  const currentWidth = parseInt(chartContainer.style('width'), 10);
  let width = currentWidth - margin.left - margin.right;
  const height = 300 - margin.top - margin.bottom;

  let svg = chartContainer
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);

  // Read the data
  d3.csv("https://raw.githubusercontent.com/marcodallastella/prison_overcrowding/main/outputs/clean/istituti_penitenziari_data.csv", data => {

    // Find the most recent date
    let mostRecentDate = d3.max(data, d => new Date(d.dati_aggiornati_al));
    // Remove unused variable 'options'
    // let options = { timeZone: 'Europe/Rome', year: 'numeric', month: 'long', day: 'numeric' };

    // Filter the data to include only rows with the most recent date
    const filteredData = data.filter(d => new Date(d.dati_aggiornati_al).getTime() === mostRecentDate.getTime());

    // Calculate posti_effettivi by removing posti_non_disponibili from posti_regolamentari
    filteredData.forEach(d => {
      d.posti_effettivi = d.posti_regolamentari - d.posti_non_disponibili;
    });

    // Calculate tasso_reale by dividing totale_detenuti by posti_effettivi and round it to 2 decimals
    filteredData.forEach(d => {
      d.tasso_reale = (d.totale_detenuti / d.posti_effettivi).toFixed(2);
    });

    // Sort the filtered data by tasso_reale in descending order
    filteredData.sort((a, b) => b.tasso_reale - a.tasso_reale);
    // Select the top 10 prisons with the highest rate
    // const topPrisons = filteredData.slice(0, 10);

    // Select the top prison with the highest rate values
    var topPrisonName = filteredData[0].institute_name;
    document.getElementById("topPrisonName").textContent = topPrisonName;

    // Select the top prison with the highest rate values
    var topPrisonTasso = filteredData[0].tasso_reale;
    document.getElementById("topPrisonTasso").textContent = topPrisonTasso;

    topTenPrisons = filteredData.slice(0, 10); // Define topTenPrisons here after the data is loaded

    // Create scales
    scaleX = d3.scaleLinear()
      .domain([0, d3.max(topTenPrisons, d => Math.max(d.posti_effettivi, d.totale_detenuti))])
      .range([0, width]);

    const scaleY = d3.scaleBand()
      .domain(topTenPrisons.map(d => d.institute_name))
      .range([0, height])
      .padding(0.1);

    // Create bars
    bars = svg.selectAll('g')
      .data(topTenPrisons)
      .enter()
      .append('g')
      .attr('transform', d => `translate(0, ${scaleY(d.institute_name)})`);

    bars.append('rect')
      .attr('width', d => scaleX(d.posti_effettivi))
      .attr('height', scaleY.bandwidth() * 0.6)
      .attr('rx', 2)
      .attr('ry', 2)
      .attr('fill', '#09099a');

    bars.append('rect')
      .attr('y', scaleY.bandwidth() * 0.6)
      .attr('width', d => scaleX(d.totale_detenuti))
      .attr('height', scaleY.bandwidth() * 0.6)
      .attr('rx', 2)
      .attr('ry', 2)
      .attr('fill', '#900404');

    // Append text elements for prison names
    bars.append('text')
      .attr('x', -5) // Adjust the position of the text relative to the bars
      .attr('y', scaleY.bandwidth() / 2)
      .attr('dy', '0.35em') // Adjust the vertical alignment of the text
      .attr('text-anchor', 'end') // Align the text to the end (right side)
      .attr('fill', 'black')
      .attr('font-size', '2vh')
      .text(d => d.institute_name);
  });




  let updateSize = () => {
    width = chartContainer.node().clientWidth - margin.right - margin.left;
    svg.attr('width', width + margin.right + margin.left);

    if (scaleX && topTenPrisons) {
      // Recalculate the maximum value for the x-axis scale based on the resized width
      const maxXValue = d3.max(topTenPrisons, d => Math.max(d.posti_effettivi, d.totale_detenuti));
      scaleX.domain([0, maxXValue]).range([0, width]); // Update the domain and range of scaleX

      // Update the width of the bars
      bars.selectAll('rect')
        .attr('width', d => scaleX(Math.max(d.posti_effettivi, d.totale_detenuti)));
    }
  };

  // Call updateSize initially to set up the chart
  updateSize();

  // Call updateSize when window is resized
  window.addEventListener('resize', updateSize);
}

createBarChart(); // Call createBarChart once


