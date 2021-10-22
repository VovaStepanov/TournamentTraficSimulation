import Link from "./link.js";

function Node(app, x, y, index) {
    var _this = this;
    if (index !== undefined) {
        this.index = index;
    }
    else {
        this.index = app.indexNode++;
    }
    this.x = 0;
    this.y = 0;
    this.f = 0;
    this.connected = false;
    this.connections = [];
    this.distances = {};
    this.links = {};
    this.path = [];
    this.hovered = false;
    this.parkingSpaceCount = 0;
    this.parkingCarCount = 0;
    this.trafficLights = {};
    this.group = app.draw.group();
    this.display = this.group.set();
    this.point = this.group.circle(10).attr({fill: '#555555'}).move(-5, -5).front();
    this.display.add(this.point);
    this.label = this.group.text('' + this.index)
        .font({size: 12, weight: 'bold'})
        .style('text-shadow', '-1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff');

    this.parkingGroup = this.group.group();
    this.display.add(this.parkingGroup.rect(15, 15).fill('#0d69e1'))
    this.display.add(this.parkingGroup.text('P')
        .font({size: 12, weight: 'bold', fill: 'white'})
        .move(4, 1));
    this.parkingLabel = this.parkingGroup.text('0')
        .font({size: 10, weight: 'bold', fill: '#0d69e1'})
        .style('text-shadow', '-1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff')
        .move(17, 15);
    this.display.add(this.parkingLabel);
    this.parkingGroup.attr({opacity: 0});
    this.parkingGroup.move(10, -10);


    this.group.draggable()
        .on('dragstart', function (e) {
            e.preventDefault();
            _this.x0 = _this.x;
            _this.y0 = _this.y;
            _this.mx = e.detail.event.clientX;
            _this.my = e.detail.event.clientY;
        })
        .on('dragmove', function (e) {
            e.preventDefault();
            if (app.mode === 'cursor') {
                //var r = draw.node.getBoundingClientRect();
                //_this.move(Math.round((e.detail.event.clientX - r.x) / step) * step, Math.round((e.detail.event.clientY - r.y) / step) * step);
                _this.move(
                    Math.round((_this.x0 + e.detail.event.clientX - _this.mx) / app.step) * app.step,
                    Math.round((_this.y0 + e.detail.event.clientY - _this.my) / app.step) * app.step
                );
            }
        });

    this.point
        .on('mouseover', function(e) {
            e.preventDefault();
            app.hoverNode = _this;
            _this.point.attr('fill', 'red');
        })
        .on('mouseout', function(e) {
            e.preventDefault();
            app.hoverNode = null;
            if (_this !== app.selected) {
                _this.point.attr('fill', '#555555');
            }
        })
        .on('mousedown', function(e) {
            e.preventDefault();
            if (app.mode === 'node') {
                if (app.lastNode) {
                    app.lastNode.connect(_this);
                    app.update();
                    app.lastNode = null;
                }
                else {
                    app.lastNode = _this;
                }
            } else if (app.mode === 'cursor') {
                _this.select();
            }
        })
        .on('dblclick', function(e) {
            e.preventDefault();
            if (app.mode === 'cursor') {
                _this.select();
                $('#node-form').modal();
            }
        });

    this.connect = function(node) {
        if (this === node || this.connections.indexOf(node) >= 0)
            return false;
        new Link(app, this, node);
        return true;
    }

    this.refresh = function() {
        let p = this.point.rbox();
        let r = app.draw.node.getBoundingClientRect();
        this.x = p.cx - r.x
        this.y = p.cy - r.y;
        for (let i in this.links) {
            this.links[i].refresh();
        }
        for (let i in this.trafficLights) {
            this.trafficLights[i].update();
        }
    }

    this.remove = function() {
        for (let i in this.links) {
            this.links[i].remove();
        }
        this.links = {}
        for (let i in this.trafficLights) {
            this.trafficLights[i].remove();
        }
        this.trafficLights = {};
        this.group.remove();
        if (app.selected === this) {
            app.selected = null;
        }

    }

    this.getStartParkingCarCount = function () {
        let count = 0;
        for (let i = 0; i < app.cars.length; i++) {
            if (app.cars[i].route[0] === this) {
                count++;
            }
        }
        return count;
    }

    this.updateParking = function () {
        if (this.parkingSpaceCount) {
            this.parkingGroup.attr({ opacity: 1 });
            this.parkingLabel.plain(this.parkingCarCount + ' / ' + this.parkingSpaceCount);
            if (this.parkingSpaceCount > this.parkingCarCount) {
                this.parkingLabel.font({fill: '#0d69e1'});
            } else {
                this.parkingLabel.font({fill: '#cc0000'});
            }
        } else {
            this.parkingGroup.attr({ opacity: 0 });
        }
    }

    this.update = function() {
        let fill = '#555555';
        if (app.selected && app.selected === this) {
            fill = 'red';
        }
        this.point.attr({'fill': fill});
        for (let i in this.links) {
            this.links[i].update();
        }
        this.updateParking();
    }

    this.move = function(x, y) {
        if (x !== this.x || y !== this.y) {
            this.x = x;
            this.y = y;
            this.group.translate(x, y);
            this.refresh();
        }
    }

    this.select = function () {
        if (app.selected) {
            app.selected.deselect();
        }
        app.selected = this;
        this.update();
    }

    this.deselect = function () {
        app.selected = null;
        this.update();
    }

    app.nodes[this.index] = this;

    this.move(x, y);
    this.refresh();
    this.update();
}

export default Node;