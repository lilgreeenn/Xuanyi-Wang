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
            
            // 将数据共享给router.js
            if (window.setProjectsData) {
                window.setProjectsData(data);
            }
            
            createProjectScreens();
            initFloatingCards();
            initScrollSnap();
            initIntroBlurEffect();
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

// 定义项目显示顺序（按用户要求的顺序）
const projectDisplayOrder = [
    'dusty memories',
    'city quest',
    'cityquest',
    'layoff',
    'layoffs',
    'kberkill',
    'shadow ball',
    'shadow play',
    'young wild and free'
];

// 检查项目是否应该显示在首页
function isFeaturedProject(projectTitle) {
    const titleLower = projectTitle.toLowerCase();
    return featuredProjectTitles.some(featured => titleLower.includes(featured));
}

// 获取项目的显示顺序
function getProjectDisplayOrder(projectTitle) {
    const titleLower = projectTitle.toLowerCase();
    for (let i = 0; i < projectDisplayOrder.length; i++) {
        if (titleLower.includes(projectDisplayOrder[i])) {
            return i;
        }
    }
    return 999; // 未匹配的项目排在最后
}

// 创建项目展示屏
function createProjectScreens() {
    const container = document.getElementById('project-screens-container');
    if (!container || !projectsData) return;
    
    container.innerHTML = '';
    
    // 只显示精选项目，并按指定顺序排序
    const featuredProjects = projectsData.projects
        .filter(project => isFeaturedProject(project.title))
        .sort((a, b) => {
            const orderA = getProjectDisplayOrder(a.title);
            const orderB = getProjectDisplayOrder(b.title);
            return orderA - orderB;
        });
    
    featuredProjects.forEach((project, index) => {
        // 创建项目屏幕
        const screen = document.createElement('section');
        screen.className = 'story-screen project-screen';
        screen.dataset.projectId = project.id;
        screen.dataset.screenIndex = (index * 2) + 1; // 奇数索引：1, 3, 5, 7...
        
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
        
        // 在每个项目屏幕后添加媒体占位屏幕（除了最后一个项目）
        if (index < featuredProjects.length - 1) {
            const mediaScreen = document.createElement('section');
            mediaScreen.className = 'story-screen media-placeholder-screen';
            mediaScreen.dataset.mediaIndex = index;
            mediaScreen.dataset.screenIndex = (index * 2) + 2; // 偶数索引：2, 4, 6, 8...
            
            mediaScreen.innerHTML = `
                <div class="media-placeholder-content" data-placeholder-index="${index}">
                    <!-- 占位位置：可以在这里添加图片或视频 -->
                    <!-- 示例：<img src="your-image.jpg" alt="Media"> -->
                    <!-- 示例：<video src="your-video.mp4" controls></video> -->
                    <!-- 示例：<iframe src="your-video-url" frameborder="0" allowfullscreen></iframe> -->
                </div>
            `;
            
            container.appendChild(mediaScreen);
        }
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
    
    // 使用所有项目照片创建背景
    const allProjects = projectsData.projects;
    
    // 创建所有项目照片，随机位置、大小、重叠，缓慢淡入
    allProjects.forEach((project, index) => {
        const card = document.createElement('div');
        card.className = 'floating-card';
        card.dataset.cardIndex = index;
        
        const img = document.createElement('img');
        img.src = project.image;
        img.alt = project.title;
        img.loading = 'lazy';
        card.appendChild(img);
        
        bgContainer.appendChild(card);
        
        // 随机位置（允许重叠和超出边界）
        const startX = Math.random() * 140 - 20; // -20% 到 120%
        const startY = Math.random() * 140 - 20;
        
        // 随机大小
        const scale = 0.2 + Math.random() * 0.5; // 0.2-0.7
        const cardWidth = 150 + Math.random() * 200; // 150-350px
        const cardHeight = cardWidth * (0.6 + Math.random() * 0.4); // 保持一定比例
        
        // 随机旋转角度
        const rotation = (Math.random() - 0.5) * 30; // -15度到15度
        
        // 随机淡入淡出循环参数
        const delay = Math.random() * 8; // 0-8秒初始延迟，让它们错开出现
        const fadeInDuration = 2 + Math.random() * 2; // 2-4秒淡入
        const stayDuration = 3 + Math.random() * 4; // 3-7秒停留
        const fadeOutDuration = 2 + Math.random() * 2; // 2-4秒淡出
        const waitDuration = 1 + Math.random() * 2; // 1-3秒等待
        const totalDuration = fadeInDuration + stayDuration + fadeOutDuration + waitDuration;
        const finalOpacity = 0.08 + Math.random() * 0.12; // 最终透明度 0.08-0.2
        
        // 计算百分比位置（用于keyframes）
        const fadeInPercent = (fadeInDuration / totalDuration) * 100;
        const stayEndPercent = ((fadeInDuration + stayDuration) / totalDuration) * 100;
        const fadeOutEndPercent = ((fadeInDuration + stayDuration + fadeOutDuration) / totalDuration) * 100;
        
        // 创建自定义keyframes（使用内联样式和动态keyframes）
        const animationName = `fadeInOutCard-${index}`;
        const keyframes = `
            @keyframes ${animationName} {
                0% { opacity: 0; }
                ${fadeInPercent}% { opacity: ${finalOpacity}; }
                ${stayEndPercent}% { opacity: ${finalOpacity}; }
                ${fadeOutEndPercent}% { opacity: 0; }
                100% { opacity: 0; }
            }
        `;
        
        // 添加动态样式
        if (!document.getElementById('dynamic-card-styles')) {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'dynamic-card-styles';
            document.head.appendChild(styleSheet);
        }
        const styleSheet = document.getElementById('dynamic-card-styles');
        styleSheet.textContent += keyframes;
        
        // 设置初始样式
        card.style.left = `${startX}%`;
        card.style.top = `${startY}%`;
        card.style.width = `${cardWidth}px`;
        card.style.height = `${cardHeight}px`;
        card.style.transform = `scale(${scale}) rotate(${rotation}deg)`;
        card.style.opacity = '0'; // 初始透明
        card.style.animationDelay = `${delay}s`;
        card.style.animationDuration = `${totalDuration}s`;
        card.style.animationName = animationName;
        card.style.animationIterationCount = 'infinite';
        card.style.animationTimingFunction = 'ease-in-out';
    });
    
    floatingCards = Array.from(bgContainer.querySelectorAll('.floating-card'));
}

// 漂浮卡片动画现在使用CSS动画，不需要JavaScript动画函数

// 初始化介绍文字模糊效果
function initIntroBlurEffect() {
    const introContent = document.getElementById('intro-content');
    const textWrapper = document.getElementById('intro-text-wrapper');
    const clearLayer = textWrapper.querySelector('.intro-text-clear');
    const blurLayer = document.getElementById('intro-text-blur');
    
    if (!introContent || !textWrapper || !clearLayer || !blurLayer) return;
    
    let mouseX = 0;
    let mouseY = 0;
    let currentX = 0;
    let currentY = 0;
    let isActive = false;
    const blurRadius = 30; // 模糊圆圈的半径
    const transitionRadius = 20; // 过渡区域的半径
    
    // 使用requestAnimationFrame平滑更新
    function updateBlur() {
        if (isActive) {
            // 平滑跟随鼠标
            currentX += (mouseX - currentX) * 0.15;
            currentY += (mouseY - currentY) * 0.15;
        } else {
            // 鼠标离开时，平滑移动到中心外
            const rect = introContent.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            currentX += (centerX - currentX) * 0.1;
            currentY += (centerY - currentY) * 0.1;
        }
        
        // 获取元素相对于视口的位置
        const rect = introContent.getBoundingClientRect();
        const relativeX = currentX - rect.left;
        const relativeY = currentY - rect.top;
        
        // 创建径向渐变遮罩：圆圈内透明（显示模糊层），圆圈外不透明（显示清晰层）
        // 使用平滑过渡边缘
        const clearMask = `radial-gradient(circle ${blurRadius + transitionRadius}px at ${relativeX}px ${relativeY}px, 
            transparent 0%, 
            transparent ${blurRadius - transitionRadius}px, 
            rgba(0,0,0,0.2) ${blurRadius}px, 
            rgba(0,0,0,1) ${blurRadius + transitionRadius}px)`;
        
        // 应用遮罩到清晰层：圆圈内隐藏，圆圈外显示
        clearLayer.style.maskImage = clearMask;
        clearLayer.style.webkitMaskImage = clearMask;
        
        // 模糊层始终显示，但只在圆形区域内可见（通过清晰层的遮罩控制）
        if (isActive) {
            blurLayer.style.opacity = '1';
        } else {
            // 检查是否还在内容区域内
            const distance = Math.sqrt(
                Math.pow(relativeX - rect.width / 2, 2) + Math.pow(relativeY - rect.height / 2, 2)
            );
            if (distance > blurRadius + transitionRadius + 100) {
                blurLayer.style.opacity = '0';
            }
        }
        
        requestAnimationFrame(updateBlur);
    }
    
    // 监听鼠标移动
    introContent.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        isActive = true;
    });
    
    // 鼠标离开时恢复
    introContent.addEventListener('mouseleave', () => {
        isActive = false;
    });
    
    // 开始动画循环
    updateBlur();
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
    
    // 检查是否是媒体占位屏幕
    const mediaScreen = document.querySelector(`.media-placeholder-screen[data-screen-index="${screenIndex}"]`);
    if (mediaScreen) {
        // 这是媒体占位屏幕，不需要处理卡片动画
        return;
    }
    
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
    
    // 显示项目信息 - 与卡片同时出现
    const infoOverlay = currentScreen.querySelector('.project-info-overlay');
    if (infoOverlay) {
        // 移除延迟，让信息与卡片同时出现
        infoOverlay.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        infoOverlay.style.opacity = '1';
        infoOverlay.style.transform = 'translateY(0)';
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

