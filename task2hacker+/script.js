

const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const groundLevel = canvas.height - 50;

let isPaused = false;
let score = 0;
let gameOver = false;
let health = 100;

const keys = {
    left: false,
    right: false,
    up: false,
    space: false
};

const camera = {
    x: 0,
    y: 0,
    update(survivor) {
        this.x = survivor.x - canvas.width / 2 + survivor.width / 2;
        this.y = survivor.y - canvas.height / 2 + survivor.height / 2;
        this.x = Math.max(0, Math.min(this.x, canvas.width));
        this.y = Math.max(0, Math.min(this.y, groundLevel));
    }
};

document.addEventListener('keydown', (e) => {
    if (e.code === 'ArrowLeft') keys.left = true;
    if (e.code === 'ArrowRight') keys.right = true;
    if (e.code === 'ArrowUp') keys.up = true;
    if (e.code === 'Space') keys.space = true;
    if (e.code === 'KeyP') togglePause();
    if (e.code === 'KeyR') restartGame();
});

document.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft') keys.left = false;
    if (e.code === 'ArrowRight') keys.right = false;
    if (e.code === 'ArrowUp') keys.up = false;
    if (e.code === 'Space') keys.space = false;
});

function togglePause() {
    if (!gameOver) {
        isPaused = !isPaused;
        if (!isPaused) {
            gameLoop();
        }
    }
}

function restartGame() {
    isPaused = false;
    score = 0;
    gameOver = false;
    health = 100;
    survivor = new Survivor(canvas.width / 2, groundLevel - 70);
    blocks = [
        new Block(280, groundLevel - 70, 70, 70, 'gray'),
        new Block(350, groundLevel - 140, 70, 70, 'gray'),
        new Block(420, groundLevel - 70, 70, 70, 'gray'),
        new Block(600, groundLevel - 200, 70, 70, 'gray'),
        new Block(1000, groundLevel - 70, 70, 70, 'gray'),
        new Block(1070, groundLevel - 140, 70, 70, 'gray'),
        new Block(1140, groundLevel - 70, 70, 70, 'gray'),
        new Block(770, groundLevel - 300, 70, 70, 'gray'),
    ];
    leftToRightZombies = [];
    rightToLeftZombies = [];
}

class Entity {
    constructor(x, y, width, height, color) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
    }

    draw(camera) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - camera.x, this.y - camera.y, this.width, this.height);
    }
}

class Survivor extends Entity {
    constructor(x, y) {
        super(x, y, 50, 70, 'blue');
        this.speed = 5;
        this.jumpPower = 10;
        this.gravity = 0.5;
        this.dy = 0;
        this.isJumping = false;
        this.ammo = [];
        this.direction = 'right';
    }

    update(blocks) {
        if (keys.left) {
            this.x -= this.speed;
            this.direction = 'left';
        }
        if (keys.right) {
            this.x += this.speed;
            this.direction = 'right';
        }

        if (this.x < 0) this.x = 0;
        if (this.x + this.width > canvas.width) this.x = canvas.width - this.width;

        if (keys.up) {
            this.dy = -this.jumpPower;
        } else {
            this.dy += this.gravity;
        }

        this.y += this.dy;

        blocks.forEach(block => {
            if (
                this.x < block.x + block.width &&
                this.x + this.width > block.x &&
                this.y + this.height > block.y &&
                this.y + this.height - this.dy <= block.y
            ) {
                this.y = block.y - this.height;
                this.dy = 0;
                this.isJumping = false;
            }
            else if (
                this.x < block.x + block.width &&
                this.x + this.width > block.x &&
                this.y < block.y + block.height &&
                this.y - this.dy >= block.y + block.height
            ) {
                this.y = block.y + block.height;
                this.dy = 0;
            }
            else if (
                this.x + this.width > block.x &&
                this.x < block.x &&
                this.y + this.height > block.y &&
                this.y < block.y + block.height
            ) {
                this.x = block.x - this.width;
            }
            else if (
                this.x < block.x + block.width &&
                this.x + this.width > block.x + block.width &&
                this.y + this.height > block.y &&
                this.y < block.y + block.height
            ) {
                this.x = block.x + block.width;
            }
        });

        if (this.y + this.height >= groundLevel) {
            this.y = groundLevel - this.height;
            this.isJumping = false;
            this.dy = 0;
        }
        if (this.y < 0) this.y = 0;

        if (keys.space) this.shoot();
        this.ammo.forEach((bullet, index) => {
            bullet.update(blocks);
            if (bullet.x > canvas.width || bullet.y + bullet.height >= groundLevel) {
                this.ammo.splice(index, 1);
            }
        });
    }

    shoot() {
        const gunTipX = this.direction === 'right' ? this.x + 60 : this.x - 10;
        const gunTipY = this.y + 20;
        if (this.ammo.length < 1 || Date.now() - this.ammo[this.ammo.length - 1].timestamp > 500) {
            this.ammo.push(new Bullet(gunTipX, gunTipY, 10, 10, 'black', this.direction));
        }
    }

    draw(camera) {
        ctx.fillStyle = 'tan';
        ctx.beginPath();
        ctx.arc(this.x + 25 - camera.x, this.y + 10 - camera.y, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'blue';
        ctx.fillRect(this.x + 15 - camera.x, this.y + 20 - camera.y, 20, 30);

        ctx.fillStyle = 'tan';
        if (this.direction === 'right') {
            ctx.fillRect(this.x + 35 - camera.x, this.y + 20 - camera.y, 15, 10);
            ctx.fillRect(this.x - camera.x, this.y + 20 - camera.y, 15, 10);
        } else {
            ctx.fillRect(this.x - camera.x, this.y + 20 - camera.y, 15, 10);
            ctx.fillRect(this.x + 35 - camera.x, this.y + 20 - camera.y, 15, 10);
        }

        ctx.save();
        if (this.direction === 'right') {
            ctx.translate(this.x + 70 - camera.x, this.y + 20 - camera.y);
            ctx.rotate(Math.PI / 1);
        } else {
            ctx.translate(this.x + 3 - camera.x, this.y + 20 - camera.y);
            ctx.rotate(Math.PI / 1);
        }
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, 25, 10);
        ctx.restore();

        ctx.fillStyle = 'blue';
        ctx.fillRect(this.x + 15 - camera.x, this.y + 50 - camera.y, 10, 20);
        ctx.fillRect(this.x + 25 - camera.x, this.y + 50 - camera.y, 10, 20);

        this.ammo.forEach(bullet => bullet.draw(camera));
    }
}

class Bullet extends Entity {
    constructor(x, y, width, height, color, direction) {
        super(x, y, width, height, color);
        this.speed = 10;
        this.gravity = 0.5;
        this.dx = direction === 'right' ? this.speed : -this.speed;
        this.dy = 0;
        this.dy = -this.gravity;
        this.direction = direction;
        this.timestamp = Date.now();
    }

    update(blocks) {
        if (this.direction === 'right') this.x += this.speed;
        else this.x -= this.speed;

        this.dy += this.gravity;
        this.y += this.dy;
        this.x += this.dx;

        blocks.forEach(block => {
            if (
                this.x < block.x + block.width &&
                this.x + this.width > block.x &&
                this.y + this.height > block.y &&
                this.y + this.height - this.dy <= block.y
            ) {
                this.x = canvas.width + 1;
                this.y = block.y - this.height;
                this.dy = 0;
            }

        });
        
            

    }
    

    draw(camera) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - camera.x, this.y - camera.y, this.width, this.height);
    }
}

class Zombie extends Entity {
    constructor(x, y, direction) {
        super(x, y, 50, 70, 'green');
        this.speed = 2;
        this.gravity = 0.5;
        this.dy = 0;
        this.direction = direction;
    }

    update(blocks, allZombies) {
        this.dy += this.gravity;
        this.y += this.dy;
        if (this.y + this.height >= groundLevel) {
            this.y = groundLevel - this.height;
            this.dy = 0;
        }
        if (this.direction === 'left') {
            this.x -= this.speed;
        } else {
            this.x += this.speed;
        }

        blocks.forEach(block => {
            for (let i = 0; i < blocks.length; i++) {
                      const block = blocks[i];
            if (
                this.x < block.x + block.width &&
                this.x + this.width > block.x &&
                this.y + this.height > block.y &&
                this.y < block.y + block.height
            ) {
                if (this.direction === 'left') {
                    this.x = block.x + block.width;
                    blocks.splice(i, 1);
                } else {
                    this.x = block.x - this.width;
                    blocks.splice(i, 1);
                }
            }
        }
        });

        allZombies.forEach(otherZombie => {
            if (otherZombie !== this) {
                if (
                    this.x < otherZombie.x + otherZombie.width &&
                    this.x + this.width > otherZombie.x &&
                    this.y + this.height > otherZombie.y &&
                    this.y < otherZombie.y + otherZombie.height
                ) {
                    if (this.direction === 'left') {
                        this.x = otherZombie.x + otherZombie.width;
                    } else {
                        this.x = otherZombie.x - this.width;
                    }
                }
            }
        });
    }






   









    draw(camera) {
        ctx.fillStyle = 'brown';
        ctx.beginPath();
        ctx.arc(this.x + 25 - camera.x, this.y + 10 - camera.y, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'green';
        ctx.fillRect(this.x + 15 - camera.x, this.y + 20 - camera.y, 20, 30);

        ctx.fillStyle = 'brown';
        ctx.fillRect(this.x - camera.x, this.y + 20 - camera.y, 15, 10);
        ctx.fillRect(this.x + 35 - camera.x, this.y + 20 - camera.y, 15, 10);

        ctx.fillStyle = 'green';
        ctx.fillRect(this.x + 15 - camera.x, this.y + 50 - camera.y, 10, 20);
        ctx.fillRect(this.x + 25 - camera.x, this.y + 50 - camera.y, 10, 20);
    }
}

class Block extends Entity {
    constructor(x, y, width, height, color) {
        super(x, y, width, height, color);
    }
}

let survivor = new Survivor(canvas.width / 2, groundLevel - 70);
let blocks = [
    new Block(280, groundLevel - 70, 70, 70, 'gray'),
    new Block(350, groundLevel - 140, 70, 70, 'gray'),
    new Block(420, groundLevel - 70, 70, 70, 'gray'),
    new Block(600, groundLevel - 200, 70, 70, 'gray'),
    new Block(1000, groundLevel - 70, 70, 70, 'gray'),
    new Block(1070, groundLevel - 140, 70, 70, 'gray'),
    new Block(1140, groundLevel - 70, 70, 70, 'gray'),
    new Block(770, groundLevel - 300, 70, 70, 'gray'),
];
let leftToRightZombies = [];
let rightToLeftZombies = [];

function spawnZombies() {
    if (leftToRightZombies.length < 3 && Math.random() < 0.02) {
        if (leftToRightZombies.every(zombie => zombie.x > 100)) {
            leftToRightZombies.push(new Zombie(0, groundLevel - 50, 'right'));
        }
    }
    if (rightToLeftZombies.length < 3 && Math.random() < 0.02) {
        if (rightToLeftZombies.every(zombie => zombie.x < canvas.width - 150)) {
            rightToLeftZombies.push(new Zombie(canvas.width - 50, groundLevel - 50, 'left'));
        }
    }
}

function handleCollisions() {
    survivor.ammo.forEach((bullet, bulletIndex) => {
        leftToRightZombies.forEach((zombie, zombieIndex) => {
            if (
                bullet.x < zombie.x + zombie.width &&
                bullet.x + bullet.width > zombie.x &&
                bullet.y < zombie.y + zombie.height &&
                bullet.y + bullet.height > zombie.y
            ) {
                survivor.ammo.splice(bulletIndex, 1);
                leftToRightZombies.splice(zombieIndex, 1);
                score += 10;
            }
        });

        rightToLeftZombies.forEach((zombie, zombieIndex) => {
            if (
                bullet.x < zombie.x + zombie.width &&
                bullet.x + bullet.width > zombie.x &&
                bullet.y < zombie.y + zombie.height &&
                bullet.y + bullet.height > zombie.y
            ) {
                survivor.ammo.splice(bulletIndex, 1);
                rightToLeftZombies.splice(zombieIndex, 1);
                score += 10;
            }
        });
    });

    leftToRightZombies.forEach(zombie => {
        if (
            survivor.x < zombie.x + zombie.width &&
            survivor.x + survivor.width > zombie.x &&
            survivor.y < zombie.y + zombie.height &&
            survivor.y + survivor.height > zombie.y
        ) {
            health -= 0.5;
            if (health <= 0) {
                gameOver = true;
            }
        }
    });

    rightToLeftZombies.forEach(zombie => {
        if (
            survivor.x < zombie.x + zombie.width &&
            survivor.x + survivor.width > zombie.x &&
            survivor.y < zombie.y + zombie.height &&
            survivor.y + survivor.height > zombie.y
        ) {
            health -= 0.5;
            if (health <= 0) {
                gameOver = true;
            }
        }
    });
}

function drawGround() {
    ctx.fillStyle = 'darkgreen';
    ctx.fillRect(0, groundLevel - camera.y, canvas.width, canvas.height - groundLevel);
}

function drawHUD() {
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${score}`, 20, 30);
    ctx.fillText(`Health: ${health}%`, 20, 60);
}

function gameLoop() {
    if (isPaused || gameOver) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGround();

    survivor.update(blocks);
    camera.update(survivor);
    survivor.draw(camera);

    blocks.forEach(block => block.draw(camera));

    spawnZombies();

    leftToRightZombies.forEach(zombie => {
        zombie.update(blocks, leftToRightZombies.concat(rightToLeftZombies));
        zombie.draw(camera);
    });

    rightToLeftZombies.forEach(zombie => {
        zombie.update(blocks, leftToRightZombies.concat(rightToLeftZombies));
        zombie.draw(camera);
    });

    handleCollisions();
    drawHUD();

   
        if (score >= 200) {
        ctx.fillStyle = 'yellow';
        ctx.font = '50px Arial';
        ctx.fillText('Survivor Wins', canvas.width / 2 - 200, canvas.height / 1.5);
        return; 
    }

    if (!gameOver) {
        requestAnimationFrame(gameLoop);
    } else {
        ctx.fillStyle = 'red';
        ctx.font = '50px Arial';
        ctx.fillText('Zombie wins', canvas.width / 2 - 150, canvas.height / 1.5);
    }
}

gameLoop();


































































































































































































































































































