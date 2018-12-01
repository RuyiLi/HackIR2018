const $ = document.querySelector.bind(document);
let PARTS = {
    LELBOW: 7,
    LWRIST: 9,
    RELBOW: 8,
    RWRIST: 10
}

const bullets = [];
const enemies = [];

const switchMode = (el) => {
    if(PARTS.LELBOW === 7) {
        // To left
        el.innerText = 'Left-handed mode';
        PARTS = {
            LELBOW: 8,
            LWRIST: 10,
            RELBOW: 7,
            RWRIST: 9
        }
    } else {
        // To right
        el.innerText = 'Right-handed mode';
        PARTS = {
            LELBOW: 7,
            LWRIST: 9,
            RELBOW: 8,
            RWRIST: 10
        }
    }
}

class Bullet {
    constructor(ctx, x, y, vel){
        this.x = x;
        this.y = y;
        this.velX = vel.x;
        this.velY = vel.y;
        this.ctx = ctx;
        setTimeout(() => {
            delete this;
        }, 2000);
    }

    draw() {
        this.ctx.fillStyle = '#87b5ff';
        this.ctx.fillRect(this.x, this.y, 5, 5);
    }

    update() {
        if(this.x > 800 || this.x < 0) {
            bullets.splice(bullets.indexOf(this), 1);
            delete this;
        } else if(this.y > 600 || this.y < 0) {
            bullets.splice(bullets.indexOf(this), 1);
            delete this;
        }
        this.x += this.velX;
        this.y += this.velY;
        this.draw();
    }
}

class Enemy {
    constructor(canvas){
        this.speed = 3;
        if(Math.random() > 0.5){
            this.x = Math.random() * canvas.width;
            this.velX = 0;
            if(Math.random() > 0.5) {
                this.y = 0;
                this.velY = this.speed;
            } else {
                this.y = canvas.height;
                this.velY = -this.speed;
            }
        } else {
            this.y = Math.random() * canvas.height;
            this.velY = 0;
            if(Math.random() > 0.5) {
                this.x = 0;
                this.velX = this.speed;
            } else {
                this.x = canvas.width;
                this.velX = -this.speed;
            }
        }
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.s = 10;
    }

    draw() {
        this.ctx.fillStyle = '#ff4747';
        this.ctx.fillRect(this.x, this.y, this.s, this.s);
    }

    update() {
        for(const b of bullets) {
            if(b.x + 5 > this.x && b.x < this.x + this.s){
                if(b.y + 5 > this.y && b.y < this.y + this.s){
                    enemies.splice(enemies.indexOf(this), 1);   
                    delete this;
                }
            }
        }
        if(this.x > this.canvas.width || this.x < 0) {
            enemies.splice(enemies.indexOf(this), 1);
            delete this;
        } else if(this.y > this.canvas.height || this.y < 0) {
            enemies.splice(enemies.indexOf(this), 1);
            delete this;
        }
        this.x += this.velX;
        this.y += this.velY;
        this.draw();
    }
}

window.onload = async () => {
    if(!posenet) return console.error('Failed to load posenet.');
    if(!tf) return console.error('Failed to load tfjs.');

    const hpBar = $('p');

    const game = $('#game');
    game.width = 800;
    game.height = 600;
    const gc = game.getContext('2d');

    const webcam = $('video');
    const canvas = $('#preview');
    canvas.width = canvas.height = 480;
    const ctx = canvas.getContext('2d');
    const net = await posenet.load();

    const player = {
        x: game.width / 2,
        y: game.height / 2,
        s: 20,
        velY: 0,
        velX: 0,
        speed: 3,
        shootCd: 0,
        hp: 20,
        bulletVel: {
            x: 0,
            y: 0
        },
        draw: function() {
            gc.fillStyle = '#87b5ff';
            gc.fillRect(this.x, this.y, this.s, this.s);
        },
        update: function() {
            for(const e of enemies) {
                if(e.x + e.s > this.x && e.x < this.x + this.s){
                    if(e.y + e.s > this.y && e.y < this.y + this.s){
                        this.hp--;
                        hpBar.innerText = `${this.hp}/20 hp`;
                        if(this.hp <= 0){
                            alert('You Died!');
                            location.reload();
                            enemies.splice(enemies.indexOf(e), 1);
                            delete e;
                        }
                    }
                }
            }

            if(this.shootCd > 0) this.shootCd--;
            else this.shoot();

            this.x += this.velX;
            if(this.x <= 0) this.x = 5;
            else if(this.x >= game.width - this.s) this.x = game.width - this.s - 5;

            this.y += this.velY;
            if(this.y <= 0) this.y = 5;
            else if(this.y >= game.height - this.s) this.y = game.height - this.s - 5;

            this.draw();
        },
        shoot: function() {
            this.shootCd = 3;
            const b = new Bullet(gc, this.x + this.s / 2 - 2.5, this.y + this.s / 2 - 2.5, this.bulletVel);
            bullets.push(b);
        }
    }

    let dir;

    const move = (dir) => {
        if(dir === 'R') {
            //gc.fillRect(game.width - 50, game.height / 2 - 25, 50, 50);
            //player.velX = player.speed;
            //player.velY = 0;
        } else if(dir === 'U') {
            //gc.fillRect(game.width / 2 - 25, 0, 50, 50);
            //player.velX = 0;
            //player.velY = -player.speed;
        } else if(dir === 'L') {
            //gc.fillRect(0, game.height / 2 - 25, 50, 50);
            //player.velX = -player.speed;
            //player.velY = 0;
        } else if(dir === 'D'){
            //gc.fillRect(game.width / 2 - 25, game.height - 50, 50, 50);
            //player.velX = 0;
            //player.velY = player.speed;
        }
    }

    const moment = async () => {
        const pose = await net.estimateSinglePose(webcam, 1, true, 16);
        ctx.drawImage(webcam, 0, 0, 480, 480);

        const { keypoints: kp } = pose;

        if(kp[PARTS.RELBOW].score > 0.3){}
        else return requestAnimationFrame(moment);
        
        const start = kp[PARTS.LELBOW].position;
        const end = kp[PARTS.LWRIST].position;
        const rad = Math.atan2(end.y - start.y, end.x - start.x);
        const angle = -rad * 180 / Math.PI;
        //player.speed = Math.sqrt((end.x - start.x) ** 2 + (end.y - start.y) ** 2);
        const magX = Math.abs((end.x - start.x) / 15) / 2;
        const magY = Math.abs((end.y - start.y) / 15) / 2;
        player.velX = end.x > start.x ? magX : -magX;
        player.velY = end.y > start.y ? magY : -magY;
        

        const bstart = kp[PARTS.RELBOW].position;
        const bend = kp[PARTS.RWRIST].position;
        
        /*
        const bmagX = Math.min(Math.abs((bend.x - bstart.x) / 5), 5) / 3;
        const bmagY = Math.min(Math.abs((bend.y - bstart.y) / 5), 5) / 3;
        player.bulletVel.x = bend.x > bstart.x ? bmagX : -bmagX;
        player.bulletVel.y = bend.y > bstart.y ? bmagY : -bmagY;
        */
        player.bulletVel.x = (bend.x - bstart.x) / 10 + 3 * (bend.x > bstart.x ? 1 : -1);
        player.bulletVel.y = (bend.y - bstart.y) / 10 + 3 * (bend.x > bstart.x ? 1 : -1);
        

        ctx.strokeStyle = '#C0FF33';
        ctx.beginPath();
        ctx.moveTo(480 - start.x, start.y);
        ctx.lineTo(480 - end.x, end.y);
        ctx.lineTo(480 - start.x, start.y);
        ctx.lineTo(480, start.y);
        ctx.lineTo(0, start.y);
        ctx.lineTo(480 - start.x, start.y);
        ctx.lineTo(480 - start.x, 0);
        ctx.lineTo(480 - start.x, 480);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(480 - bstart.x, bstart.y);
        ctx.lineTo(480 - bend.x, bend.y);
        ctx.lineTo(480 - bstart.x, bstart.y);
        ctx.lineTo(480, bstart.y);
        ctx.lineTo(0, bstart.y);
        ctx.lineTo(480 - bstart.x, bstart.y);
        ctx.lineTo(480 - bstart.x, 0);
        ctx.lineTo(480 - bstart.x, 480);
        ctx.stroke();
        //console.log('Angle is ' + angle);

        if(angle > -45 && angle < 45) dir = 'R'
        else if(angle > 45 && angle < 135) dir = 'U'
        else if(angle > 135 || angle < -135) dir = 'L'
        else dir = 'D'

        requestAnimationFrame(moment);
    }

    const renderPlayer = () => {
        gc.clearRect(0, 0, game.width, game.height);
        player.update();
        for(const b of bullets){
            if(b) b.update();
        }
        for(const e of enemies){
            if(e) e.update();
        }
        requestAnimationFrame(renderPlayer);
    }

    const spawnEnemy = () => {
        enemies.push(new Enemy(game));
    }

    requestAnimationFrame(renderPlayer);

    if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
                width: 480,
                height: 480
            } 
        });
        webcam.height = webcam.width = 480;
        webcam.srcObject = stream;
        await new Promise((res) => {
            webcam.addEventListener('loadeddata', res, false);
        });
        webcam.play();
        requestAnimationFrame(moment);
        for(let i = 0; i < 5; i++) {
            spawnEnemy();
        }
        setInterval(spawnEnemy, 500);
    }
}