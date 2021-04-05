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
    console.log(data);
    xValues.push(moment(data.startTime, "HH-mm-ss").format("LTS"));
    yValues.push(data.activityName);
  });

  window.intradayChart.config.data.labels = xValues;
  window.intradayChart.config.data.datasets[0].data = yValues;

  window.intradayChart.update();
}

