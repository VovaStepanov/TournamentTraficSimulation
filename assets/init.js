import App from "./classes/app.js"
import ThreeDimentionalApp from "./classes/threeDimentionalApp.js"

let threeMode = false;
let modeBtn = $(".three-dimention-mode");
let app;
$(document).ready(function() {
    app = new App('container', 5000, 3000);

    init(app);

});

modeBtn.on("click", () => {
    $("#container").html(""); // clears container for 3d canvas

    threeMode = !threeMode;
    let data = saveData(app);

    if(threeMode) app = new ThreeDimentionalApp('container', 5000, 3000);
    else app = new App('container', 5000, 3000);

    app.nodes = data.nodes;
    app.cars = data.cars

    init(app);
})

function init(app) {

    let reader = new FileReader();

    reader.onerror = function (event) {
        alert('Помилка читання файлу');
    };

    reader.onload = function (event) {
        app.load(JSON.parse(event.target.result));
    };

    document.getElementById('file').onchange = function () {
        if (!this.files || this.files.length !== 1 || this.files[0].type !== 'application/json') {
            alert('Виберіть текстовий файл')
        } else {
            reader.readAsText(this.files[0]);
        }
    };

    document.getElementById('open-file').onclick = function () {
        document.getElementById('file').click();
    }

    document.getElementById('save-file').onclick = function () {
        let a = document.getElementById('save');
        a.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(app.dump())));
        a.click();
    }

    document.getElementById('clear').onclick = function () {
        app.clear();
    }

    document.getElementById('cursor').onclick = function () {
        app.setMode('cursor');
    }

    document.getElementById('node').onclick = function () {
        app.setMode('node');
    }

    window.onkeydown = function(e) {
        if (app.selected) {
            if (e.key === 'Delete') {
                app.selected.remove();
                app.selected = null;
                app.update();
                return;
            }
        }
        if (e.key === 'Escape') {
            app.setMode('cursor');
            app.lastNode = null;
        }
    }

    $('#start').on('click', function(e) {
        e.preventDefault();
        let result = app.start();
        if (result.error) {
            alert(result.error);
        }
    });

    $('#stop').on('click', function(e) {
        e.preventDefault();
        app.stop();
    });

    $('#restore').on('click', function(e) {
        e.preventDefault();
        app.restore();
    });

    $('#change-speed').on('click', function(e) {
        e.preventDefault();
        let value = parseInt(prompt('Швидкість симуляції',  app.speed));
        if (value < 1) {
            app.speed = 1;
        } else if (value > 10) {
            app.speed = 10;
        } else if (value) {
            app.speed = value;
        }
        $('#speed').text(app.speed);
    });

    $('#car-form-submit').on('click', function (e) {
        let route = $('#car-route').val() || '';
        let speed = parseInt($('#car-speed').val(), 10);
        let delay = parseInt($('#car-delay').val(), 10);
        route = route.split(',');
        if (route.length < 2) {
            alert('Не коректні дані');
            return;
        }
        let routeNodes = [];
        for (let i=0; i < route.length - 1; i++) {
            let a = app.nodes[parseInt(route[i], 10)];
            let b = app.nodes[parseInt(route[i + 1], 10)];
            if (!a || !b) {
                alert('Не коректні дані');
                return;
            }
            if (i === 0 && !a.parkingSpaceCount || i === route.length -1 && !b.parkingSpaceCount) {
                alert('Початковий та кінцевий пункти поїздки мають бути місцем для паркування.');
                return;
            }
            let path = getMinPath(findAllPaths(a, b, []));
            if (!path) {
                alert('Неможливо побудувати маршрут');
                return;
            }
            if (i === 0) {
                routeNodes.push(a);
            }
            routeNodes.push(b);
        }
        new Car(app, routeNodes, speed, delay);
        $('#car-form').modal('hide');
    });

    $('#car-list-show').on('click', function (e) {
        e.preventDefault();
        let html = ''
        for (let i=0; i < app.cars.length; i++) {
            let car = app.cars[i];
            html += '<tr><td>' + car.getRouteIndexes().join(', ') + '</td><td>' + car.speed + ' км/год</td><td>' + car.delay + ' c.</td></tr>';
        }
        $('#car-list table tbody').html(html);
        $('#car-list').modal();
    });

    $('#car-list-clear').on('click', function (e) {
        e.preventDefault();
        app.clearCars();
    });

    $('#car-generate').on('click', function (e) {
        e.preventDefault();
        let count = parseInt(prompt('Кількість автомобілей', '10'), 10) || 0;
        for (let i = 0; i < count; i++) {
            app.addRandomCar();
        }
    });

    $('#node-form').on('shown.bs.modal', function() {
        let node = app.selected;
        let html =
            '<div class="form-group row">' +
                '<div class="col-sm-6">Автомобілей на старті</div>' +
                '<div class="col-sm-6"><strong>' + node.getStartParkingCarCount() + '</strong></div>' +
            '</div>' +
            '<div class="form-group row">' +
                '<label for="parking-space-count" class="col-sm-6 col-form-label">Паркувальних місць</label>' +
                '<div class="col-sm-6">' +
                    '<input type="number" class="form-control" id="parking-space-count" min="0" max="200" value="' + node.parkingSpaceCount + '">' +
                '</div>' +
            '</div>';
        for (let i = 0; i < node.connections.length; i++) {
            let b = node.connections[i];
            let trafficLight = node.trafficLights[b.index];
            let redTime = 0;
            let greenTime = 0;
            let startTime = 0;
            if (trafficLight) {
                greenTime = trafficLight.greenTime;
                redTime = trafficLight.redTime;
                startTime = trafficLight.startTime;
            }
            html +=
            '<p><strong>Світлофор на вузол ' + b.index + '</strong></p>' +
            '<div class="form-group row">' +
                '<label for="green-time-' + i+ '" class="col-sm-2 col-form-label">Зелене</label>' +
                '<div class="col-sm-2">' +
                    '<input type="number" class="form-control" id="green-time-' + i + '" min="0" max="200" value="' + greenTime + '">' +
                '</div>' +
                '<label for="red-time-' + i+ '" class="col-sm-2 col-form-label">Червоне</label>' +
                '<div class="col-sm-2">' +
                    '<input type="number" class="form-control" id="red-time-' + i + '" min="0" max="200" value="' + redTime + '">' +
                '</div>' +
                '<label for="start-time-' + i+ '" class="col-sm-2 col-form-label">Початок</label>' +
                '<div class="col-sm-2">' +
                    '<input type="number" class="form-control" id="start-time-' + i + '" min="0" max="200" value="' + startTime + '">' +
                '</div>' +
            '</div>';
        }
        $('#node-form .modal-body').html(html);
    });
    $('#node-form-submit').on('click', function() {
        let node = app.selected;
        node.parkingSpaceCount = parseInt($('#parking-space-count').val(), 10) || 0;
        node.update();
        for (let i = 0; i < node.connections.length; i++) {
            let b = node.connections[i];
            let greenTime = parseInt($('#green-time-' + i).val(), 10);
            let redTime = parseInt($('#red-time-' + i).val(), 10);
            let startTime = parseInt($('#start-time-' + i).val(), 10);
            let trafficLight = node.trafficLights[b.index];
            if (greenTime > 0 && redTime > 0) {
                if (!trafficLight) {
                    trafficLight = new TrafficLight(app, node, b);
                }
                trafficLight.greenTime = greenTime;
                trafficLight.redTime = redTime;
                trafficLight.startTime = startTime;
            } else {
                if (trafficLight) {
                    trafficLight.remove();
                }
            }
        }
        $('#node-form').modal('hide');
    });

    $('#link-form').on('shown.bs.modal', function() {
        let link = app.selected;
        $('#link-type').val(link.type);
        $('#link-max-speed').val(link.maxSpeed || '');
    });

    $('#link-form-submit').on('click', function () {
        let link = app.selected;
        link.type = $('#link-type').val();
        link.maxSpeed = parseInt($('#link-max-speed').val(), 10) || 0;
        link.deselect();
        link.update();
        $('#link-form').modal('hide');
    });
}

// saves everything before toggle the mode
function saveData(app) {
    let data = {cars: app.cars,
            nodes: app.nodes};
    return data;
}