function Car(app, route, speed, delay) {
    var _this = this;
    this.route = route;
    this.routeIndex = 0;
    this.speed = speed;
    this.currentSpeed = 0;
    this.distance = 0;
    this.delay = delay;
    this.a = null;
    this.b = null;
    this.d = 0;
    this.path = [];
    this.pathIndex = 0;
    this.colors = ['#003366', '#0000cc', '#6600cc', '#660066', '#990033', '#663300', '#336600', '#003300'];
    this.color = this.colors[randomInteger(0, this.colors.length)];
    this.group = app.draw.group();
    this.display = this.group.set();
    this.display.add(this.group.rect(10, 6).fill(this.color).move(-5, -6));
    this.display.add(this.group.circle(2).attr({fill: 'yellow'}).move(-5, -2));
    this.display.add(this.group.circle(2).attr({fill: 'yellow'}).move(-5, -6));
    this.display.add(this.group.circle(2).attr({fill: 'red'}).move(3, -2));
    this.display.add(this.group.circle(2).attr({fill: 'red'}).move(3, -6));
    this.toast = null;
    this.active = false;
    this.motion = false;
    this.route[0].parkingCarCount++;
    this.route[0].updateParking();

    this.getRouteIndexes = function () {
        let indexes = [];
        for (let i = 0; i < this.route.length; i++) {
            indexes.push(this.route[i].index);
        }
        return indexes;
    }

    this.move = function(x, y) {
        if (x !== this.x || y !== this.y) {
            this.x = x;
            this.y = y;
            this.group.translate(x, y);
        }
    }

    this.rotate = function () {
        if (this.a && this.b) {
            let angel = Math.atan2(this.b.y - this.a.y, this.b.x - this.a.x) * 180 / Math.PI;
            this.display.rotate(angel + 180, 0, 0);
        }
    }

    this.process = function() {
        if (!this.active) {
            return;
        }
        if (this.delay && app.tick < this.delay*20) {
            return;
        }
        if (!this.motion) {
            this.motion = true;
            this.move(this.a.x, this.a.y);
            this.rotate();
            this.group.attr({ opacity: 1 });
            this.a.parkingCarCount--;
            this.a.updateParking();
        }
        let speed = this.speed / 20;
        let maxSpeed = this.a.links[this.b.index].maxSpeed;
        if (maxSpeed && speed > maxSpeed / 20) {
            speed = maxSpeed / 20;
        }
        for (let i = 0; i < app.cars.length; i++) {
            let car = app.cars[i];
            if (this !== car && car.motion && this.a === car.a && this.b === car.b && this.d < car.d) {
                if ((car.d - (this.d + speed)) < 15) {
                    speed = car.d - this.d - 15;
                    break;
                }
            }
        }
        if (speed <= 0) {
            this.currentSpeed = 0;
            this.updateToast();
            return;
        }
        this.currentSpeed = speed * 20;
        let vx = this.b.x - this.a.x;
        let vy = this.b.y - this.a.y;
        let vl = Math.sqrt(vx*vx + vy*vy);
        vx = vx / vl;
        vy = vy / vl;
        let x = this.x + vx * speed;
        let y = this.y + vy * speed;
        let d = getLineLength(this.a.x, this.a.y, x, y);
        let m = getLineLength(this.a.x, this.a.y, this.b.x, this.b.y) - d;
        if (m <= 0) {
            x = this.b.x;
            y = this.b.y;
            if (this.pathIndex < (this.path.length - 2)) {
                this.pathIndex++;
                this.a = this.path[this.pathIndex];
                this.b = this.path[this.pathIndex + 1];
                this.d = 0;
                this.move(x, y);
                this.rotate();
            } else {
                if (this.routeIndex < (this.route.length - 2)) {
                    this.routeIndex++;
                    this.path = getMinPath(findAllPaths(this.route[this.routeIndex], this.route[this.routeIndex + 1], []));
                    if (this.path) {
                        this.pathIndex = 0;
                        this.a = this.path[0];
                        this.b = this.path[1];
                        this.d = 0;
                        this.move(this.a.x, this.a.y);
                        this.rotate();
                    } else {
                        this.active = false;
                        this.motion = false;
                        this.currentSpeed = 0;
                        this.group.animate({
                          duration: 1000
                        }).attr({ opacity: 0 });
                    }
                }
                else {
                    if (this.b.parkingSpaceCount > this.b.parkingCarCount) {
                        this.b.parkingCarCount++;
                        this.b.updateParking();
                        this.currentSpeed = 0;
                        this.active = false;
                        this.motion = false;
                        this.group.animate({
                            duration: 1000
                        }).attr({opacity: 0});
                    } else {
                        console.log('No parking spaces');
                        this.currentSpeed = 0;
                    }
                }
            }
        } else {
            let trafficLight = this.b.trafficLights[this.a.index];
            if (m > 20 || !trafficLight || trafficLight.color === 'green') {
                this.d = d;
                this.move(x, y);
                this.distance += this.currentSpeed / 3600 / 20;
            } else {
                this.currentSpeed = 0;
            }
        }
        this.updateToast();
    }

    this.start = function() {
        this.routeIndex = 0;
        this.pathIndex = 0;
        this.path = getMinPath(findAllPaths(this.route[0], this.route[1], []));
        if (this.path) {
            this.a = this.path[0];
            this.b = this.path[1];
            this.d = 0;
            this.a.parkingCarCount++;
            this.a.updateParking();
            this.active = true;
            this.motion = false;
            this.move(this.a.x, this.a.y);
            this.rotate();
            this.group.attr({ opacity: 0 });
            this.distance = 0;
            this.currentSpeed = 0;
            return {success: true}
        } else{
            this.motion = false;
            return {success: false, error: 'Не можливо побудувати маршрут'};
        }
    }

    this.remove = function() {
        this.group.remove();
    }

    this.updateToast = function() {
        if (this.toast) {
            this.toast.find('.current-speed').text(this.currentSpeed);
            this.toast.find('.distance').text(Math.round(this.distance * 100) / 100);
        }
    }

    app.cars.push(this);
    $('#car-count').text(app.cars.length);

    this.group.on('dblclick', function(e) {
        e.preventDefault();
        if (_this.toast) {
            return;
        }
        $('#toasts').append('<div class="toast" role="alert" aria-live="assertive" aria-atomic="true" data-autohide="false"></div>');
        _this.toast = $('#toasts .toast').last();
        _this.toast.html(
            '<div class="toast-header">' +
                '<strong class="mr-auto">Автомобіль ' + app.cars.indexOf(_this) + '</strong>' +
                '<button type="button" class="ml-2 mb-1 close" data-dismiss="toast" aria-label="Close">' +
                    '<span aria-hidden="true">&times;</span>' +
                '</button>' +
            '</div>' +
            '<div class="toast-body">' +
                '<div>Маршрут: ' + _this.getRouteIndexes().join(', ') + '</div>' +
                '<div>Звичайна швидкість: ' + _this.speed + ' км/год</div>' +
                '<div>Поточна швидкість: <span class="current-speed"></span> км/год</div>' +
                '<div>Пройдений шлях: <span class="distance"></span> км</div>' +
            '</div>');
        _this.updateToast();
        _this.toast.toast('show');
        _this.toast.on('hide.bs.toast', function () {
            _this.toast = null;
        });
    });
}

export default Car;