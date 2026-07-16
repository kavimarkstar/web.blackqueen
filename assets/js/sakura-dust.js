document.addEventListener("DOMContentLoaded", () => {
    // 1. Dynamic ලෙස Canvas එක සාදා එකතු කිරීම
    const canvas = document.createElement('canvas');
    canvas.id = 'gasCanvas';

    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.pointerEvents = 'none'; // clicks වලට බාධා නොවීම සඳහා
    canvas.style.zIndex = '9999';

    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let trailParticles = [];
    let ambientParticles = [];
    const maxAmbient = 50; // වැටෙන පෙති ගණන (ඕනෑවට වඩා වැඩි නොකර සෞම්‍ය මට්ටමක තබා ඇත)

    // ඔයාගේ Theme එකට ගැලපෙන මෘදු Pink, Purple සහ Blue ගෑස් වලාකුළු වර්ණ
    const gasColors = [
        { r: 232, g: 78, b: 102 },   // Soft Pink
        { r: 148, g: 0, b: 211 },   // Deep Purple
        { r: 59, g: 130, b: 246 }    // Royal Blue
    ];

    // සකුරා මල් පෙති සඳහා Pink, Purple සහ Blue වර්ණ කාණ්ඩය
    const themeColors = [
        "#ffb7c5", // Soft Pink
        "#ff99b6", // Light Rose
        "#d8b4fe", // Pastel Purple
        "#a78bfa", // Royal Purple/Violet
        "#93c5fd", // Light Royal Blue
        "#60a5fa"  // Sky Blue
    ];

    let mouseX = -1000;
    let mouseY = -1000;
    let lastX = null;
    let lastY = null;
    let mouseVx = 0;
    let mouseVy = 0;

    // 1. සියුම් මෘදු දුමාරය (Very Slow & Tiny)
    class SoftGas {
        constructor(x, y) {
            this.type = 'gas';

            // මවුස් එක වටා ඉතා සියුම් ලෙස විසිරීම
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * 15;
            this.x = x + Math.cos(angle) * dist;
            this.y = y + Math.sin(angle) * dist;

            // ඉතාම අඩු වේගයක් (Slow Drift)
            this.vx = (Math.random() - 0.5) * 0.4;
            this.vy = (Math.random() - 0.5) * 0.4 - 0.1;

            this.size = Math.random() * 10 + 8; // ප්‍රමාණය සෑහෙන්න කුඩා කර ඇත
            this.alpha = 0.18; // ඉතාම සියුම් පෙනුම
            this.rotation = Math.random() * Math.PI * 2;
            this.rotationSpeed = (Math.random() - 0.5) * 0.01; // හෙමින් කැරකීම
            this.color = gasColors[Math.floor(Math.random() * gasColors.length)];
            this.fadeRate = Math.random() * 0.004 + 0.004; // හෙමින් මැකී යාම
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.rotation += this.rotationSpeed;
            this.size += 0.4;
            this.alpha -= this.fadeRate;
        }

        draw() {
            if (this.alpha <= 0) return;
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);

            let gradient = ctx.createRadialGradient(0, 0, this.size * 0.1, 0, 0, this.size);
            gradient.addColorStop(0, `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${this.alpha})`);
            gradient.addColorStop(0.5, `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${this.alpha * 0.2})`);
            gradient.addColorStop(1, `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 0)`);

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.ellipse(0, 0, this.size, this.size * 0.8, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    // 2. හුළඟේ පාවෙන මෘදු මල් පෙති (Gentle Swaying Petals)
    class FloatingPetal {
        constructor(isAmbient = false) {
            this.isAmbient = isAmbient;
            this.reset(isAmbient);
        }

        reset(initialSetup = false) {
            // ප්‍රමාණය ඉතාම කුඩා කර ඇත (Micro Sizes)
            this.size = Math.random() * 3.5 + 2.5; // 2.5px සිට 6px දක්වා ඉතා සියුම් පෙති
            this.color = themeColors[Math.floor(Math.random() * themeColors.length)];
            this.angle = Math.random() * Math.PI * 2;
            this.spinSpeed = (Math.random() - 0.5) * 0.02; // හෙමින් කැරකීම
            this.flip = Math.random() * Math.PI;
            this.flipSpeed = Math.random() * 0.02 + 0.01; // 3D පෙරළීම ඉතාම සෙමින්

            // පැද්දෙන ස්වභාවය (Gentle Swaying)
            this.wobble = Math.random() * Math.PI * 2;
            this.wobbleSpeed = Math.random() * 0.015 + 0.008;

            if (this.isAmbient) {
                this.x = Math.random() * canvas.width;
                this.y = initialSetup ? Math.random() * canvas.height : -10;
                this.vx = (Math.random() - 0.5) * 0.3; // හෙමින් දෙපැත්තට පාවීම
                this.vy = Math.random() * 0.35 + 0.25; // ඉතාම සෙමින් පහළට වැටීම
                this.alpha = Math.random() * 0.4 + 0.25;
                this.fadeRate = 0;
            } else {
                // මවුස් එක චලනය වන විට හැදෙන පෙති
                const angle = Math.random() * Math.PI * 2;
                const dist = Math.random() * 20;
                this.x = mouseX + Math.cos(angle) * dist;
                this.y = mouseY + Math.sin(angle) * dist;

                // බෝල වගේ වේගයෙන් විසිවීම වැළැක්වීමට මවුස් වේගය ඉතාම අඩුවෙන් බලපැවැත්වීම
                this.vx = mouseVx * 0.04 + (Math.random() - 0.5) * 0.6;
                this.vy = mouseVy * 0.04 + Math.random() * 0.5 + 0.3;
                this.alpha = Math.random() * 0.4 + 0.5;
                this.fadeRate = Math.random() * 0.003 + 0.003; // වැඩි වෙලාවක් ලස්සනට පාවෙමින් තිබේ
            }
        }

        update() {
            // හුළඟේ පැද්දෙමින් පාවෙන චලිතය (Sine-wave sway)
            this.x += this.vx + Math.sin(this.wobble) * 0.3;
            this.y += this.vy;

            // වේගය ක්‍රමයෙන් නැති කිරීම (High Friction / Damping)
            this.vx *= 0.98;
            if (!this.isAmbient) this.vy *= 0.98;

            this.wobble += this.wobbleSpeed;
            this.flip += this.flipSpeed;
            this.angle += this.spinSpeed;

            // ==========================================
            // 🌀 GENTLE MOUSE BREEZE (මෘදු සුළං බලපෑම)
            // ==========================================
            let dx = mouseX - this.x;
            let dy = mouseY - this.y;
            let distance = Math.sqrt(dx * dx + dy * dy);
            const breezeRadius = 150; // බලපෑම් සීමාව

            if (distance < breezeRadius) {
                let force = (breezeRadius - distance) / breezeRadius;

                // තල්ලු කිරීම ඉතාම මෘදුව සිදුවේ (Gentle Drift)
                let pushX = (dx / distance) * force * 0.25;
                let pushY = (dy / distance) * force * 0.15;

                this.vx -= pushX;
                this.vy -= pushY;

                // මවුස් එක ලඟදී මෘදුව සෙලවීම වැඩි කිරීම
                this.angle += this.spinSpeed * force * 1.5;
            }

            // වැටී අවසන් වූ පසු නැවත මුදුනෙන් පටන් ගැනීම (Ambient පමණි)
            if (this.isAmbient) {
                if (this.y > canvas.height + 10 || this.x < -10 || this.x > canvas.width + 10) {
                    this.reset(false);
                }
            } else {
                this.alpha -= this.fadeRate;
            }
        }

        draw() {
            if (this.alpha <= 0) return;
            ctx.save();
            ctx.globalAlpha = this.alpha;
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle);
            ctx.fillStyle = this.color;

            // 3D Flip පෙනුම
            ctx.beginPath();
            ctx.ellipse(0, 0, this.size * Math.abs(Math.cos(this.flip)), this.size * 0.6, 0, 0, Math.PI * 2);
            ctx.fill();

            // ඉතා සියුම් මැද නහරය
            ctx.strokeStyle = 'rgba(255,255,255,0.12)';
            ctx.beginPath();
            ctx.moveTo(-this.size * Math.abs(Math.cos(this.flip)), 0);
            ctx.lineTo(this.size * Math.abs(Math.cos(this.flip)), 0);
            ctx.stroke();

            ctx.restore();
        }
    }

    // ආරම්භයේදීම Ambient පෙති සෑදීම
    for (let i = 0; i < maxAmbient; i++) {
        ambientParticles.push(new FloatingPetal(true));
    }

    // මවුස් එක ගමන් කරන විට මෘදු ලෙස පෙති ජනනය කිරීම
    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;

        if (lastX === null || lastY === null) {
            lastX = mouseX;
            lastY = mouseY;
            return;
        }

        mouseVx = mouseX - lastX;
        mouseVy = mouseY - lastY;
        let speed = Math.sqrt(mouseVx * mouseVx + mouseVy * mouseVy);

        // මවුස් එක යනකොට හැදෙන පෙති ගණන (ඕනෑවට වඩා ගොඩ ගැහෙන්නේ නැති වෙන්න සීමා කර ඇත)
        let spawnCount = Math.min(Math.floor(speed / 8) + 1, 3);

        for (let i = 0; i < spawnCount; i++) {
            if (Math.random() < 0.4) {
                trailParticles.push(new SoftGas(mouseX, mouseY));
            }

            if (Math.random() < 0.3) {
                trailParticles.push(new FloatingPetal(false));
            }
        }

        lastX = mouseX;
        lastY = mouseY;
    });

    window.addEventListener('mouseout', () => {
        mouseX = -1000;
        mouseY = -1000;
        lastX = null;
        lastY = null;
    });

    // ප්‍රධාන සජීවීකරණ ලූපය (Animation Loop)
    function animate() {
        requestAnimationFrame(animate);

        ctx.globalCompositeOperation = 'source-over';
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 1. පසුබිමේ වැටෙන සියුම් පෙති ඇඳීම
        for (let i = 0; i < ambientParticles.length; i++) {
            ambientParticles[i].update();
            ambientParticles[i].draw();
        }

        // 2. මවුස් එකෙන් හැදෙන පෙති සහ සියුම් දුමාරය ඇඳීම
        for (let i = trailParticles.length - 1; i >= 0; i--) {
            trailParticles[i].update();

            if (trailParticles[i].type === 'gas') {
                ctx.globalCompositeOperation = 'screen';
            } else {
                ctx.globalCompositeOperation = 'source-over';
            }

            trailParticles[i].draw();

            if (trailParticles[i].alpha <= 0) {
                trailParticles.splice(i, 1);
            }
        }
    }

    animate();
});