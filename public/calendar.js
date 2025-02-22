var access_token;
var user_id;
var userHeartRateData;
var date;
var startTime;
var endTime;
var timeRange;
var detailLevel;
var activity;

var ctx = document.getElementById("calendarChart").getContext("2d");
var chartConfig = {
  type: "bar",
  data: {
    labels: [],
    datasets: [
      {
        lineTension: 1,
        backgroundColor: "transparent",
        borderColor: "#007bff",
        borderWidth: 4,
        pointBackgroundColor: "#007bff",
        pointRadius: 0,
        fill: false,
        data: [],
        spanGaps: false
      }
    ]
  },
  options: {
    maintainAspectRatio: false,

    scales: {
      yAxes: [
        {
          scaleLabel: {
            display: true,
            labelString: "beats per minute"
          },
          ticks: {
            beginAtZero: false
          }
        }
      ],
      xAxes: [
        {
          scaleLabel: {
            display: true,
            labelString: "time"
          },
          ticks: {
            beginAtZero: false
          }
        }
      ]
    },
    legend: {
      display: false
    },
    tooltips: {
      mode: "index",
      intersect: false,
      callbacks: {
        label: function(tooltipItem, data) {
          var label = data.datasets[tooltipItem.datasetIndex].label || "";

          if (label) {
            label += ": ";
          }
          label += tooltipItem.yLabel + " bpm";
          return label;
        }
      }
    }
  }
};

var margin = { top: 50, right: 0, bottom: 100, left: 30 },
          width = 960 - margin.left - margin.right,
          height = 430 - margin.top - margin.bottom,
          gridSize = Math.floor(width / 24),
          legendElementWidth = gridSize*2,
          buckets = 9,
          colors = ["#ffffd9","#edf8b1","#c7e9b4","#7fcdbb","#41b6c4","#1d91c0","#225ea8","#253494","#081d58"], // alternatively colorbrewer.YlGnBu[9]
          days = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
          times = ["1a", "2a", "3a", "4a", "5a", "6a", "7a", "8a", "9a", "10a", "11a", "12p", "1p", "2p", "3p", "4p", "5p", "6p", "7p", "8p", "9p", "10p", "11p", "12a"];
          datasets = ["data.tsv", "data2.tsv"];

      var svg = d3.select("#chart").append("svg")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom)
          .append("g")
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      var dayLabels = svg.selectAll(".dayLabel")
          .data(days)
          .enter().append("text")
            .text(function (d) { return d; })
            .attr("x", 0)
            .attr("y", function (d, i) { return i * gridSize; })
            .style("text-anchor", "end")
            .attr("transform", "translate(-6," + gridSize / 1.5 + ")")
            .attr("class", function (d, i) { return ((i >= 0 && i <= 4) ? "dayLabel mono axis axis-workweek" : "dayLabel mono axis"); });

      var timeLabels = svg.selectAll(".timeLabel")
          .data(times)
          .enter().append("text")
            .text(function(d) { return d; })
            .attr("x", function(d, i) { return i * gridSize; })
            .attr("y", 0)
            .style("text-anchor", "middle")
            .attr("transform", "translate(" + gridSize / 2 + ", -6)")
            .attr("class", function(d, i) { return ((i >= 7 && i <= 16) ? "timeLabel mono axis axis-worktime" : "timeLabel mono axis"); });

      var heatmapChart = function(tsvFile) {
        d3.tsv(tsvFile,
        function(d) {
          return {
            day: +d.day,
            hour: +d.hour,
            value: +d.value
          };
        },
        function(error, data) {
          var colorScale = d3.scale.quantile()
              .domain([0, buckets - 1, d3.max(data, function (d) { return d.value; })])
              .range(colors);

          var cards = svg.selectAll(".hour")
              .data(data, function(d) {return d.day+':'+d.hour;});

          cards.append("title");

          cards.enter().append("rect")
              .attr("x", function(d) { return (d.hour - 1) * gridSize; })
              .attr("y", function(d) { return (d.day - 1) * gridSize; })
              .attr("rx", 4)
              .attr("ry", 4)
              .attr("class", "hour bordered")
              .attr("width", gridSize)
              .attr("height", gridSize)
              .style("fill", colors[0]);

          cards.transition().duration(1000)
              .style("fill", function(d) { return colorScale(d.value); });

          cards.select("title").text(function(d) { return d.value; });
          
          cards.exit().remove();

          var legend = svg.selectAll(".legend")
              .data([0].concat(colorScale.quantiles()), function(d) { return d; });

          legend.enter().append("g")
              .attr("class", "legend");

          legend.append("rect")
            .attr("x", function(d, i) { return legendElementWidth * i; })
            .attr("y", height)
            .attr("width", legendElementWidth)
            .attr("height", gridSize / 2)
            .style("fill", function(d, i) { return colors[i]; });

          legend.append("text")
            .attr("class", "mono")
            .text(function(d) { return "≥ " + Math.round(d); })
            .attr("x", function(d, i) { return legendElementWidth * i; })
            .attr("y", height + gridSize);

          legend.exit().remove();

        });  
      };

      heatmapChart(datasets[0]);
      
      var datasetpicker = d3.select("#dataset-picker").selectAll(".dataset-button")
        .data(datasets);

      datasetpicker.enter()
        .append("input")
        .attr("value", function(d){ return "Dataset " + d })
        .attr("type", "button")
        .attr("class", "dataset-button")
        .on("click", function(d) {
          heatmapChart(d);
        });

document.addEventListener("DOMContentLoaded", function() {
  access_token = sessionStorage.getItem("access_token");
  user_id = sessionStorage.getItem("user_id_token");

  if (!access_token && !user_id) {
    window.location.replace("./index.html");
  }

  $(function() {
    $('input[name="date"]').daterangepicker({
      singleDatePicker: true,
      showDropdowns: true,
      maxDate: new Date()
    });
  });
  getUserHeartRateData();
  window.intradayChart = new Chart(ctx, chartConfig);
});



function formatDate(day) {
  var sections = day.split("/");
  var year = sections.pop();
  sections.unshift(year);

  var result = sections.join("-");

  return result;
}

function getUserHeartRateData(date) {
  var header = new Headers();
  header.append("Authorization", "Bearer " + access_token);
  var init = {
    headers: header
  };

  fetch('https://api.fitbit.com/1/user/-/activities/list.json?beforeDate=&afterDate=2021-01-01&sort=asc&offset=0&limit=50', init)
  .then((response) => {
    return response.json();
  })
  .then((activityData) => {
    userActivityData = activityData["activities"];
    console.log(userActivityData);
    createInterdayGraph(userActivityData);
  });
}



var customTooltips = function(tooltip) {
  $(this._chart.canvas).css("cursor", "pointer");

  var positionY = this._chart.canvas.offsetTop;
  var positionX = this._chart.canvas.offsetLeft;

  $(".chartjs-tooltip").css({
    opacity: 0
  });

  if (!tooltip || !tooltip.opacity) {
    return;
  }

  if (tooltip.dataPoints.length > 0) {
    tooltip.dataPoints.forEach(function(dataPoint) {
      var content = dataPoint.yLabel + " bpm <br> at " + dataPoint.xLabel;
      var $tooltip = $("#tooltip-" + dataPoint.datasetIndex);

      $tooltip.html(content);
      $tooltip.css({
        opacity: 1,
        top: 25 + positionY + dataPoint.y + "px",
        left: positionX + dataPoint.x + "px"
      });
    });
  }
};

function createInterdayGraph(heartRateData) {
  var xValues = [];
  var yValues = [];

  heartRateData.forEach(function(data, idx, arr) {
    xValues.push(moment(data.startTime, "YYYY-MM-DDTHH:mm:ss").format("LL"));
    yValues.push(data.activityName);
  });

  window.intradayChart.config.data.labels = xValues;
  window.intradayChart.config.data.datasets[0].data = yValues;

  window.intradayChart.update();
}

