import Car from "./car.js";
import Node from "./node.js";
import TrafficLight from "./traficLight.js";

function App(containerId, width, height) {
    var _this = this;
    this.nodes = {};
    this.mode = 'cursor';
    this.step = 16;
    this.width = width;
    this.height = height;
    this.draw = SVG('container').size(width, height);
    this.grid = this.draw.path('M 0 0').stroke({width: 1, color: '#e5e5e5'});
    this.linkGroup = this.draw.group();
    this.link0Group = this.draw.group();
    this.carGroup = this.draw.group();
    this.line = this.draw.line(0, 0, 0, 0).stroke({width: 2, color: 'red'}).hide();
    this.indexNode = 0;
    this.hoverNode = null;
    this.lastNode = null;
    this.selected = null;
    this.cars = [];
    this.timerId = null;
    this.tick = 0;
    this.speed = 1;
    this.status = '';

    this.drawGrid = function () {
        let step = this.step;
        let width = Math.ceil(this.width / step) - 1;
        let height = Math.ceil(this.height / step) - 1;
        let p = 'M ' + width * step + ' 0 ' + width * step + ' ' + height * step;
        p += 'M  0 ' + height * step + ' ' + width * step + ' ' + height * step;
        for (let x = 0; x < width; x++)
            p += ' M ' + x * step + ' 0 L ' + x * step + ' ' + height * step;

        for (let y = 0; y < height; y++)
            p += ' M 0 ' + y * step + ' L ' + width * step + ' ' + y * step;
        this.grid.plot(p);
    }

    this.setMode = function(mode) {
        this.mode = mode;
        if (mode !== 'cursor' && this.selected) {
            this.selected.deselect();
            this.selected = null;
        }
        if (mode === 'node') {
            this.lastNode = null;
            this.draw.style('cursor',  'crosshair');
        }
        else {
            this.draw.style('cursor',  'default');
        }
    }

    this.update = function () {
        for (let i in this.nodes) {
            this.nodes[i].update();
        }
    }

    this.clearCars = function () {
        for (let i=0; i < this.cars.length; i++) {
            this.cars[i].remove();
        }
        this.cars = [];
        for (let i in this.nodes) {
            this.nodes[i].parkingCarCount = 0;
            this.nodes[i].updateParking();
        }
        $('#car-count').text('0');
    }

    this.clear = function () {
        this.clearCars();
        for (let i in this.nodes){
            this.nodes[i].remove();
        }
        this.nodes = {};
        this.indexNode = 0;
    }

    this.dump = function () {
        let data = {
            nodes: [],
            cars: []
        };
        for (let i in this.nodes) {
            let node = this.nodes[i];
            let item = {
                index: node.index,
                x: node.x,
                y: node.y,
                parkingSpaceCount: node.parkingSpaceCount,
                connections: [],
                links: [],
                trafficLights: [],
            }
            for (let j = 0; j < node.connections.length; j++) {
                item.connections.push(node.connections[j].index);
            }
            for (let j in node.links) {
                let link = node.links[j];
                item.links.push({
                    index: parseInt(j, 10),
                    type: link.type,
                    maxSpeed: link.maxSpeed
                })
            }
            for (let j in node.trafficLights) {
                let trafficLight = node.trafficLights[j];
                item.trafficLights.push({
                    index: trafficLight.b.index,
                    greenTime: trafficLight.greenTime,
                    redTime: trafficLight.redTime,
                    startTime: trafficLight.startTime,
                });
            }
            data.nodes.push(item);
        }
        for (let i = 0; i < this.cars.length; i++) {
            let car = this.cars[i];
            let item = {
                route: car.getRouteIndexes(),
                speed: car.speed,
                delay: car.delay
            }
            data.cars.push(item);
        }

        return data;
    }

    this.load = function(data) {
        this.setMode('cursor');
        this.clear();
        for (let i = 0; i < data.nodes.length; i++) {
            let item = data.nodes[i];
            let node = new Node(this, item.x, item.y, item.index);
            node.parkingSpaceCount = item.parkingSpaceCount || 0;
            if (item.index > this.indexNode) {
                this.indexNode = item.index + 1;
            }
        }
        for (let i = 0; i < data.nodes.length; i++) {
            let item = data.nodes[i];
            let node = this.nodes[item.index];
            for (let j = 0; j < item.connections.length; j++) {
                node.connect(this.nodes[item.connections[j]]);
            }
            if (item.links) {
                for (let j = 0; j < item.links.length; j++) {
                    let linkItem = item.links[j];
                    let link = node.links[linkItem.index];
                    link.type = linkItem.type;
                    link.maxSpeed = linkItem.maxSpeed || 0;
                }
            }
            for (let j = 0; j < item.trafficLights.length; j++) {
                let trafficLightItem = item.trafficLights[j];
                let trafficLight = new TrafficLight(this, node, this.nodes[trafficLightItem.index]);
                trafficLight.greenTime = trafficLightItem.greenTime;
                trafficLight.redTime = trafficLightItem.redTime;
                trafficLight.startTime = trafficLightItem.startTime;
            }
        }
        if (data.cars) {
            for (let i = 0; i < data.cars.length; i++) {
                let item = data.cars[i];
                let route = [];
                for (let j = 0; j < item.route.length; j++) {
                    route.push(this.nodes[item.route[j]]);
                }
                new Car(this, route, item.speed, item.delay);
            }
        }
        this.update();
    }

    this.process = function() {
        for (let t=0; t < this.speed; t++) {
            this.tick++;
            for (let i in this.nodes) {
                let node = this.nodes[i];
                for (let j in node.trafficLights) {
                    node.trafficLights[j].process();
                }
            }
            for (let i = 0; i < this.cars.length; i++) {
                this.cars[i].process();
            }
            $('#time').text(Math.ceil(this.tick / 20));
        }
    }

    this.start = function () {
        if (this.timerId) {
            clearInterval(this.timerId);
        }
        this.tick = 0;
        for (let i in this.nodes) {
            this.nodes[i].parkingCarCount = 0;
            this.nodes[i].updateParking();
        }
        for (let i = 0; i < this.cars.length; i++) {
            let result = this.cars[i].start();
            if (result.error) {
                return {success: false, error: result.error}
            }
        }
        this.timerId = setInterval(function() {
            _this.process()
        }, 50);
        this.setMode('process');
        this.status = 'processing';
        return {success: true};
    }

    this.stop = function () {
        if (this.timerId) {
            this.status = 'pause';
            clearInterval(this.timerId);
        }
        this.setMode('cursor');
    }

    this.restore = function () {
        if (this.status === 'pause') {
            this.status = 'processing';
            this.timerId = setInterval(function () {
                _this.process()
            }, 50);
            this.setMode('process');
        }
    }

    this.addRandomCar = function () {
        let speed = randomInteger(40, 70);
        let delay = randomInteger(0, 10);
        let parkingNodes = [];
        let notParkingNodes = [];
        for (let i in this.nodes) {
            let node = this.nodes[i];
            if (node.parkingSpaceCount) {
                parkingNodes.push(node);
            }
            else{
                notParkingNodes.push(node);
            }
        }
        let lastNode = null;
        for (let i=0; i < parkingNodes.length; i++) {
            let node = parkingNodes[randomInteger(0, parkingNodes.length)];
            if (node.parkingSpaceCount > node.parkingCarCount) {
                lastNode = node;
                break;
            }
        }
        if (!lastNode) {
            console.log('No free parking spaces.');
            return;
        }
        let route = [lastNode];
        let n = randomInteger(3, 5);
        for (let i = 0; i < n; i++) {
            let exist = false;
            for (let j = 0; j < 100; j++) {
                let node = null;
                if (i === n - 1) {
                    node = parkingNodes[randomInteger(0, parkingNodes.length)];
                }
                else {
                    node = notParkingNodes[randomInteger(0, notParkingNodes.length)];
                }
                if (node !== lastNode && findAllPaths(lastNode, node, []).length > 0) {
                    exist = true;
                    route.push(node);
                    lastNode = node;
                    break;
                }
            }
            if (!exist) {
                return;
            }
        }
        new Car(this, route, speed, delay);
    }

    this.draw.on('mousedown', function(e) {
        e.preventDefault();
        let r = _this.draw.node.getBoundingClientRect();
        let x = Math.round((e.clientX - r.x) / _this.step) * _this.step;
        let y = Math.round((e.clientY - r.y) / _this.step) * _this.step;
        if (_this.mode === 'cursor' && _this.selected) {
            _this.selected.deselect();
            _this.selected = null;
        }
        if (_this.mode === 'node') {
            let exists = false;
            for (let i in _this.nodes) {
                let node = _this.nodes[i];
                if (x === node.x && y === node.y) {
                    exists = true;
                    if (_this.lastNode) {
                        _this.lastNode.connect(node);
                        _this.update();
                        _this.lastNode = null;
                    } else {
                        _this.lastNode = node;
                    }
                    break;
                }
            }
            if (!exists) {
                let node = new Node(_this, x, y);
                if (_this.lastNode) {
                    _this.lastNode.connect(node);
                }
                _this.update();
                _this.lastNode = node;
            }
        }
        else {
            _this.lastNode = null;
        }
    });

    this.draw.on('mousemove', function(e) {
        if (_this.mode === 'node' && _this.lastNode) {
            e.preventDefault();
            let r = _this.draw.node.getBoundingClientRect();
            let x = Math.round((e.clientX - r.x) / _this.step);
            let y = Math.round((e.clientY - r.y) / _this.step);
            let c = _this.lastNode.point.rbox();
            _this.line.plot(c.cx - r.x, c.cy - r.y, x * _this.step, y * _this.step).show();
        }
        else {
            _this.line.hide();
        }
    });

    this.drawGrid();
}

export default App;
