function Link(app, a, b) {
    let _this = this;
    this.x1 = 0;
    this.y1 = 0;
    this.x2 = 0;
    this.y2 = 0;
    this.a = a;
    this.b = b;
    this.maxSpeed = 0;
    this.type = 'asphalt';
    this.colors = {
        'asphalt': '#AAAAAA',
        'dirt': '#999966'
    };
    this.line = app.linkGroup.line(0, 0, 1, 1).stroke({width: 11, color: this.colors[this.type], linecap: 'round'});
    this.line0 = app.link0Group.line(0, 0, 1, 1).stroke({width: 1, color: 'white', linecap: 'round'});
    this.distance = getLineLength(this.a.x, this.a.y, this.b.x, this.b.y);
    a.links[b.index] = this;
    b.links[a.index] = this;
    a.connections.push(b);
    b.connections.push(a);
    a.distances[b.index] = this.distance;
    b.distances[a.index] = this.distance;
    this.refresh = function() {
        this.line0.plot(this.a.x, this.a.y, this.b.x, this.b.y);
        this.line.plot(this.a.x, this.a.y, this.b.x, this.b.y);
    }

    this.update = function() {
        let color = this.colors[this.type];
        if (app.selected === this) {
            color = 'red';
        }
        this.line.attr('stroke', color);
        this.refresh();
    }

    this.line.on('click', function() {
        if (app.mode === 'cursor') {
            _this.select();
        }
    });

    this.line.on('dblclick', function(e) {
        e.preventDefault();
        if (app.mode === 'cursor') {
            _this.select();
            $('#link-form').modal();
        }
    });

    this.select = function () {
        if (app.selected) {
            app.selected.deselect();
        }
        app.selected = this;
        _this.update();
    }

    this.deselect = function() {
        app.selected = null;
        this.update();
    }

    this.remove = function() {
        if (app.selected === this) {
            this.deselect();
            app.selected = null;
        }
        let trafficLight = this.a.trafficLights[this.b.index];
        if (trafficLight) {
            trafficLight.remove();
            delete this.a.trafficLights[this.b.index];
        }
        trafficLight = this.b.trafficLights[this.a.index];
        if (trafficLight) {
            trafficLight.remove();
            delete this.b.trafficLights[this.a.index];
        }
        removeFromList(this.a.connections, this.b);
        removeFromList(this.b.connections, this.a);
        delete this.a.links[this.b.index];
        delete this.b.links[this.a.index];
        this.line.remove();
        this.line0.remove();
    }

    this.refresh();
    this.update();
}

export default Link;