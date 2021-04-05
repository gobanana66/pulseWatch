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
chart = {
  const svg = d3.create("svg")
      .attr("viewBox", [0, 0, width, height * years.length])
      .attr("font-family", "sans-serif")
      .attr("font-size", 10);

  const year = svg.selectAll("g")
    .data(years)
    .join("g")
      .attr("transform", (d, i) => `translate(40.5,${height * i + cellSize * 1.5})`);

  year.append("text")
      .attr("x", -5)
      .attr("y", -5)
      .attr("font-weight", "bold")
      .attr("text-anchor", "end")
      .text(([key]) => key);

  year.append("g")
      .attr("text-anchor", "end")
    .selectAll("text")
    .data(weekday === "weekday" ? d3.range(1, 6) : d3.range(7))
    .join("text")
      .attr("x", -5)
      .attr("y", i => (countDay(i) + 0.5) * cellSize)
      .attr("dy", "0.31em")
      .text(formatDay);

  year.append("g")
    .selectAll("rect")
    .data(weekday === "weekday"
        ? ([, values]) => values.filter(d => ![0, 6].includes(d.date.getUTCDay()))
        : ([, values]) => values)
    .join("rect")
      .attr("width", cellSize - 1)
      .attr("height", cellSize - 1)
      .attr("x", d => timeWeek.count(d3.utcYear(d.date), d.date) * cellSize + 0.5)
      .attr("y", d => countDay(d.date.getUTCDay()) * cellSize + 0.5)
      .attr("fill", d => color(d.value))
    .append("title")
      .text(d => `${formatDate(d.date)}
${formatValue(d.value)}${d.close === undefined ? "" : `
${formatClose(d.close)}`}`);

  const month = year.append("g")
    .selectAll("g")
    .data(([, values]) => d3.utcMonths(d3.utcMonth(values[0].date), values[values.length - 1].date))
    .join("g");

  month.filter((d, i) => i).append("path")
      .attr("fill", "none")
      .attr("stroke", "#fff")
      .attr("stroke-width", 3)
      .attr("d", pathMonth);

  month.append("text")
      .attr("x", d => timeWeek.count(d3.utcYear(d), timeWeek.ceil(d)) * cellSize + 2)
      .attr("y", -5)
      .text(formatMonth);

  return svg.node();
}
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
  console.log(access_token);
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
    console.log(activityData);
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
    console.log(data.startTime);
    console.log(data.activityName);
    xValues.push(moment(data.startTime, "YYYY-MM-DDTHH:mm:ss").format("LL"));
    yValues.push(data.activityName);
  });

  window.intradayChart.config.data.labels = xValues;
  window.intradayChart.config.data.datasets[0].data = yValues;

  window.intradayChart.update();
}

