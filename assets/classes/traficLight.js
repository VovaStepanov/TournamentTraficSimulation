function TrafficLight(app, a, b) {
    this.a = a;
    this.b = b;
    this.a.trafficLights[b.index] = this;
    this.tick = 0;
    this.startTime = 0;
    this.greenTime = 0;
    this.redTime = 0;
    this.color = null;
    this.group = app.draw.group();
    this.display = this.group.set();
    this.red = this.group.circle(8).attr({fill: 'red', stroke: 'black'}).move(-4, -8).front();
    this.display.add(this.red);
    this.green = this.group.circle(8).attr({fill: 'green', stroke: 'black'}).move(-4, 0).front();
    this.display.add(this.green);

    this.update = function () {
        let angel = Math.atan2(this.b.y - this.a.y, this.b.x - this.a.x);
        angel = angel - 35 * Math.PI / 180
        let x = this.a.x + Math.cos(angel) * 20;
        let y = this.a.y + Math.sin(angel) * 20;
        this.group.move(x, y);
    }

    this.process = function () {
        this.tick++;
        if (this.tick / 20 > (this.greenTime + this.redTime)) {
            this.tick = 0;
        }
        if (this.tick / 20 <= this.greenTime) {
            this.color = 'green';
            this.green.attr('fill', 'green');
            this.red.attr('fill', 'white');
        } else {
            this.color = 'red';
            this.green.attr('fill', 'white');
            this.red.attr('fill', 'red');
        }
    }

    this.start = function () {
        if (this.startTime) {
            this.tick = this.startTime * 20;
        } else {
            this.tick = 0;
        }
    }

    this.remove = function () {
        this.group.remove();
    }

    this.update();
}

export default TrafficLight;