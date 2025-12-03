// 单轨叙事系统
let projectsData = null;
let currentScreenIndex = 0;
let isScrolling = false;
let floatingCards = [];

// 初始化单轨叙事系统
export function initSingleTrack() {
    console.log('Initializing single track narrative...');
    
    // 确保主页可见
    const homePage = document.getElementById('home-page');
    if (homePage) {
        // 添加single-track-mode类，这会隐藏body::before
        document.body.classList.add('single-track-mode');
        document.body.classList.add('loaded'); // 也添加loaded类，确保遮罩消失
        
        // 设置body样式
        document.body.style.paddingTop = '0';
        document.body.style.overflow = 'hidden';
        
        // 设置主页样式
        homePage.style.display = 'block';
        homePage.style.visibility = 'visible';
        homePage.style.opacity = '1';
        homePage.style.zIndex = '10000';
        
        console.log('Home page set to visible');
    } else {
        console.error('Home page element not found!');
        return;
    }
    
    // 确保介绍屏可见
    const introScreen = document.getElementById('intro-screen');
    if (introScreen) {
        introScreen.style.display = 'flex';
        introScreen.style.visibility = 'visible';
        introScreen.style.opacity = '1';
        introScreen.style.position = 'relative';
        introScreen.style.zIndex = '10';
        console.log('Intro screen set to visible');
    } else {
        console.error('Intro screen element not found!');
    }
    
    // 确保介绍内容可见
    const introContent = document.querySelector('.intro-content');
    if (introContent) {
        introContent.style.display = 'block';
        introContent.style.visibility = 'visible';
        introContent.style.opacity = '1';
        console.log('Intro content set to visible');
    }
    
    // 确保标题可见
    const introTitle = document.querySelector('.intro-title');
    if (introTitle) {
        introTitle.style.display = 'block';
        introTitle.style.visibility = 'visible';
        introTitle.style.opacity = '1';
        introTitle.style.color = '#000';
        console.log('Intro title set to visible');
    }
    
    // 加载项目数据
    fetch('data.json')
        .then(res => {
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            return res.json();
        })
        .then(data => {
            console.log('Projects data loaded:', data.projects.length, 'projects');
            projectsData = data;
            createProjectScreens();
            initFloatingCards();
            initScrollSnap();
        })
        .catch(err => {
            console.error('Failed to load projects data:', err);
            // 即使加载失败，也确保介绍页可见
            if (introScreen) {
                introScreen.style.display = 'flex';
            }
        });
}

// 定义要显示在首页和PROJECTS的项目（不区分大小写）
const featuredProjectTitles = [
    'shadow ball',
    'shadow play',
    'kberkill',
    'cityquest',
    'layoff',
    'dusty',
    'young wild and free'
];

// 检查项目是否应该显示在首页
function isFeaturedProject(projectTitle) {
    const titleLower = projectTitle.toLowerCase();
    return featuredProjectTitles.some(featured => titleLower.includes(featured));
}

// 创建项目展示屏
function createProjectScreens() {
    const container = document.getElementById('project-screens-container');
    if (!container || !projectsData) return;
    
    container.innerHTML = '';
    
    // 只显示精选项目
    const featuredProjects = projectsData.projects.filter(project => 
        isFeaturedProject(project.title)
    );
    
    featuredProjects.forEach((project, index) => {
        const screen = document.createElement('section');
        screen.className = 'story-screen project-screen';
        screen.dataset.projectId = project.id;
        screen.dataset.screenIndex = index + 1;
        
        screen.innerHTML = `
            <div class="project-screen-content">
                <div class="project-card-3d" data-card-index="${index}">
                    <img src="${project.image}" alt="${project.title}">
                </div>
                <div class="project-info-overlay">
                    <h2 class="project-screen-title">${project.title}</h2>
                    <p class="project-screen-description">${project.description ? project.description.replace(/<br\s*\/?>/gi, ' ').substring(0, 200) + '...' : ''}</p>
                    <button class="view-details-btn" data-project-id="${project.id}">View Details →</button>
                </div>
            </div>
        `;
        
        container.appendChild(screen);
    });
    
    console.log(`Created ${featuredProjects.length} featured project screens`);
    
    // 绑定查看详情按钮
    container.querySelectorAll('.view-details-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const projectId = parseInt(e.target.dataset.projectId);
            if (window.navigateToProject) {
                window.navigateToProject(projectId);
            }
        });
    });
    
    // 初始化卡片位置
    setTimeout(() => {
        initCardPositions();
    }, 100);
}

// 初始化背景漂浮卡片
function initFloatingCards() {
    const bgContainer = document.getElementById('floating-cards-bg');
    if (!bgContainer || !projectsData) return;
    
    // 创建多个卡片在背景中缓慢漂浮
    projectsData.projects.slice(0, 8).forEach((project, index) => {
        const card = document.createElement('div');
        card.className = 'floating-card';
        card.style.cssText = `
            position: absolute;
            width: 300px;
            height: 200px;
            background: url('${project.image}') center/cover;
            border-radius: 8px;
            opacity: 0.3;
            transform: translate(${Math.random() * 100 - 50}vw, ${Math.random() * 100 - 50}vh) 
                       rotate(${Math.random() * 360}deg) 
                       scale(${0.4 + Math.random() * 0.3});
            transition: transform 20s linear;
            pointer-events: none;
        `;
        bgContainer.appendChild(card);
        floatingCards.push(card);
        
        // 启动漂浮动画
        animateFloatingCard(card, index);
    });
}

// 漂浮卡片动画
function animateFloatingCard(card, index) {
    const duration = 20 + Math.random() * 10; // 20-30秒
    const startX = Math.random() * 100;
    const startY = Math.random() * 100;
    const endX = (startX + 50 + Math.random() * 50) % 100;
    const endY = (startY + 50 + Math.random() * 50) % 100;
    
    const animate = () => {
        const progress = (Date.now() / 1000) % duration / duration;
        const x = startX + (endX - startX) * progress;
        const y = startY + (endY - startY) * progress;
        const rotation = progress * 360;
        
        card.style.transform = `
            translate(${x}vw, ${y}vh) 
            rotate(${rotation}deg) 
            scale(${0.4 + Math.random() * 0.3})
        `;
        
        requestAnimationFrame(animate);
    };
    animate();
}

// 初始化滚动snap
function initScrollSnap() {
    const container = document.getElementById('home-page');
    if (!container) return;
    
    // 使用节流优化滚动性能
    let lastScrollTop = 0;
    let ticking = false;
    
    function handleScroll() {
        if (ticking) return;
        
        requestAnimationFrame(() => {
            const scrollTop = container.scrollTop;
            const screenHeight = window.innerHeight;
            const currentScreen = Math.floor(scrollTop / screenHeight + 0.5);
            
            if (currentScreen !== currentScreenIndex) {
                currentScreenIndex = currentScreen;
                animateCardTransition(currentScreen);
            }
            
            ticking = false;
        });
        
        ticking = true;
    }
    
    // 监听滚动，使用passive提高性能
    container.addEventListener('scroll', handleScroll, { passive: true });
    
    // 初始触发一次
    setTimeout(() => {
        const scrollTop = container.scrollTop;
        const screenHeight = window.innerHeight;
        const currentScreen = Math.floor(scrollTop / screenHeight + 0.5);
        currentScreenIndex = currentScreen;
        animateCardTransition(currentScreen);
    }, 100);
}

// 卡片转场动画
function animateCardTransition(screenIndex) {
    if (screenIndex === 0) {
        // 回到介绍页，恢复背景卡片
        floatingCards.forEach(card => {
            card.style.opacity = '0.3';
        });
        
        // 隐藏所有项目卡片
        document.querySelectorAll('.project-card-3d').forEach(card => {
            card.style.opacity = '0.2';
        });
        
        // 隐藏所有项目信息
        document.querySelectorAll('.project-info-overlay').forEach(overlay => {
            overlay.style.opacity = '0';
            overlay.style.transform = 'translateY(30px)';
        });
        return;
    }
    
    // 隐藏背景卡片
    floatingCards.forEach(card => {
        card.style.opacity = '0.1';
    });
    
    // 获取当前屏幕的项目卡片
    const currentScreen = document.querySelector(`.project-screen[data-screen-index="${screenIndex}"]`);
    if (!currentScreen) return;
    
    const card = currentScreen.querySelector('.project-card-3d');
    if (!card) return;
    
    const cardIndex = parseInt(card.dataset.cardIndex);
    
    // 卡片飞到中央的动画
    card.style.transition = 'opacity 0.6s ease, transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
    card.style.transform = 'translate(0, 0) scale(1.2) rotateY(0deg) rotateX(0deg)';
    card.style.opacity = '1';
    card.style.zIndex = '1000';
    
    // 延迟添加鼠标移动3D效果，等待动画完成
    setTimeout(() => {
        addCard3DEffect(card);
    }, 800);
    
    // 显示项目信息
    const infoOverlay = currentScreen.querySelector('.project-info-overlay');
    if (infoOverlay) {
        setTimeout(() => {
            infoOverlay.style.opacity = '1';
            infoOverlay.style.transform = 'translateY(0)';
        }, 600);
    }
    
    // 处理其他屏幕的卡片
    document.querySelectorAll('.project-card-3d').forEach((otherCard) => {
        if (otherCard !== card) {
            const otherScreen = otherCard.closest('.project-screen');
            if (!otherScreen) return;
            
            const otherScreenIndex = parseInt(otherScreen.dataset.screenIndex);
            const offset = otherScreenIndex - screenIndex;
            
            otherCard.style.transition = 'opacity 0.6s ease, transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
            otherCard.style.opacity = '0.2';
            otherCard.style.transform = `translate(${offset * 200}px, ${offset * 100}px) scale(0.6) rotateY(${offset * 45}deg) rotateX(0deg)`;
            otherCard.style.zIndex = '100';
            
            // 移除其他卡片的3D效果
            if (otherCard._mouseMoveHandler) {
                otherCard.removeEventListener('mousemove', otherCard._mouseMoveHandler);
                otherCard.removeEventListener('mouseleave', otherCard._mouseLeaveHandler);
                otherCard._mouseMoveHandler = null;
                otherCard._mouseLeaveHandler = null;
            }
            
            // 隐藏其他屏幕的信息
            const otherOverlay = otherScreen.querySelector('.project-info-overlay');
            if (otherOverlay) {
                otherOverlay.style.opacity = '0';
                otherOverlay.style.transform = 'translateY(30px)';
            }
        }
    });
}

// 初始化时设置第一屏的卡片位置
function initCardPositions() {
    document.querySelectorAll('.project-card-3d').forEach((card, index) => {
        const screen = card.closest('.project-screen');
        if (!screen) return;
        
        const screenIndex = parseInt(screen.dataset.screenIndex);
        const offset = screenIndex;
        
        // 初始位置：卡片分散在屏幕外
        card.style.cssText = `
            position: absolute;
            width: 600px;
            height: 400px;
            transform: translate(${offset * 200}px, ${offset * 100}px) scale(0.6) rotateY(${offset * 45}deg) rotateX(0deg);
            opacity: 0.3;
            transition: opacity 0.6s ease, transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
            transform-style: preserve-3d;
            cursor: pointer;
            will-change: transform;
        `;
        
        // 初始隐藏信息
        const infoOverlay = screen.querySelector('.project-info-overlay');
        if (infoOverlay) {
            infoOverlay.style.opacity = '0';
            infoOverlay.style.transform = 'translateY(30px)';
            infoOverlay.style.transition = 'all 0.8s ease-out';
        }
    });
}

// 添加卡片3D鼠标跟随效果
function addCard3DEffect(card) {
    if (!card) return;
    
    // 移除旧的鼠标事件监听器（如果存在）
    const oldMouseMove = card._mouseMoveHandler;
    const oldMouseLeave = card._mouseLeaveHandler;
    
    if (oldMouseMove) {
        card.removeEventListener('mousemove', oldMouseMove);
    }
    if (oldMouseLeave) {
        card.removeEventListener('mouseleave', oldMouseLeave);
    }
    
    // 创建新的鼠标移动处理函数
    const handleMouseMove = (e) => {
        const rect = card.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // 计算鼠标相对于卡片中心的位置（-1 到 1）
        const mouseX = (e.clientX - centerX) / (rect.width / 2);
        const mouseY = (e.clientY - centerY) / (rect.height / 2);
        
        // 计算旋转角度（限制在合理范围内）
        const rotateY = mouseX * 15; // 最大15度
        const rotateX = -mouseY * 15; // 最大15度（负号让旋转更自然）
        
        // 获取当前的基础transform（去掉之前的rotate）
        const currentTransform = card.style.transform;
        const baseTransform = currentTransform.replace(/rotateY\([^)]*\)/g, '').replace(/rotateX\([^)]*\)/g, '').trim();
        
        // 应用3D旋转
        card.style.transition = 'transform 0.1s ease-out';
        card.style.transform = `${baseTransform} rotateY(${rotateY}deg) rotateX(${rotateX}deg)`;
    };
    
    // 鼠标离开时重置
    const handleMouseLeave = () => {
        const currentTransform = card.style.transform;
        const baseTransform = currentTransform.replace(/rotateY\([^)]*\)/g, '').replace(/rotateX\([^)]*\)/g, '').trim();
        
        card.style.transition = 'transform 0.5s ease-out';
        card.style.transform = `${baseTransform} rotateY(0deg) rotateX(0deg)`;
    };
    
    // 保存引用以便后续移除
    card._mouseMoveHandler = handleMouseMove;
    card._mouseLeaveHandler = handleMouseLeave;
    
    // 添加事件监听器
    card.addEventListener('mousemove', handleMouseMove);
    card.addEventListener('mouseleave', handleMouseLeave);
}

