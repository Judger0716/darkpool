new Chart(document.getElementById("mixed-chart"), {
    type: 'bar',
    data: {
      labels: ["2010", "2011", "2012", "2013","2014","2015","2016","2017"],
      datasets: [{
          label: "Africa",
          type: "line",
          borderColor: "#0cb567",
          data: [100,600,695,995,500,700,700,800,500],
          fill: false
        }, {
          label: "Africa",
          type: "bar",
          backgroundColor: "rgba(255,206,0,1)",
          backgroundColorHover: "#3e95cd",
          data: [690,390,485,890,640,390,600,690]
        }
      ]
    },
    options: {
      title: {
        display: true,
        text: 'Crypto Currency Groth'
      },
      legend: { display: false },
      layout: {
        padding: {
          left: 50,
          right: 50
        }
      }
    }
});