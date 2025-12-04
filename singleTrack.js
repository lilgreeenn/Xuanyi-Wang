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
            // 延迟加载背景卡片，提高初始加载速度
            setTimeout(() => {
                initFloatingCards();
            }, 500);
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
    // 排除Dusty Memories(Comic)，因为它会与Dusty Memories并排显示
    const featuredProjects = projectsData.projects
        .filter(project => {
            const titleLower = project.title.toLowerCase();
            // 排除Dusty Memories(Comic)，因为它会与Dusty Memories并排显示
            if (titleLower.includes('dusty') && titleLower.includes('comic')) {
                return false;
            }
            const isFeatured = isFeaturedProject(project.title);
            if (!isFeatured) {
                console.log('Project filtered out:', project.title);
            }
            return isFeatured;
        })
        .sort((a, b) => {
            const orderA = getProjectDisplayOrder(a.title);
            const orderB = getProjectDisplayOrder(b.title);
            return orderA - orderB;
        });
    
    console.log('Featured projects found:', featuredProjects.length);
    console.log('Featured projects:', featuredProjects.map(p => p.title));
    
    if (featuredProjects.length === 0) {
        console.error('No featured projects found! Check isFeaturedProject function.');
        return;
    }
    
    // 使用DocumentFragment批量创建DOM，提高性能
    const fragment = document.createDocumentFragment();
    
    // 查找Dusty Memories(Comic)项目
    const dustyComicProject = projectsData.projects.find(p => 
        p.title.toLowerCase().includes('dusty') && p.title.toLowerCase().includes('comic')
    );
    
    featuredProjects.forEach((project, index) => {
        const projectTitleLower = project.title.toLowerCase();
        const isDustyMain = projectTitleLower.includes('dusty') && !projectTitleLower.includes('comic');
        
        // 创建项目屏幕
        const screen = document.createElement('section');
        screen.className = 'story-screen project-screen';
        screen.dataset.projectId = project.id;
        screen.dataset.screenIndex = (index * 2) + 1; // 奇数索引：1, 3, 5, 7...
        
        // 如果是Dusty Memories主项目，添加并排布局类
        if (isDustyMain && dustyComicProject) {
            screen.classList.add('dual-project-screen');
        }
        
        // 如果是Dusty Memories主项目，创建并排布局
        if (isDustyMain && dustyComicProject) {
            screen.innerHTML = `
                <div class="project-screen-content dual-project-content">
                    <div class="project-card-wrapper">
                        <div class="project-card-3d" data-card-index="${index}">
                            <img src="${project.image}" alt="${project.title}" loading="lazy" decoding="async" fetchpriority="${index === 0 ? 'high' : 'low'}">
                        </div>
                        <div class="project-info-overlay">
                            <h2 class="project-screen-title">${project.title}</h2>
                            <p class="project-screen-description">${project.description ? project.description.replace(/<br\s*\/?>/gi, ' ').substring(0, 150) + '...' : ''}</p>
                            <button class="view-details-btn" data-project-id="${project.id}">View Details →</button>
                        </div>
                    </div>
                    <div class="project-card-wrapper">
                        <div class="project-card-3d" data-card-index="${index}-comic">
                            <img src="${dustyComicProject.image}" alt="${dustyComicProject.title}" loading="lazy" decoding="async">
                        </div>
                        <div class="project-info-overlay">
                            <h2 class="project-screen-title">${dustyComicProject.title}</h2>
                            <p class="project-screen-description">${dustyComicProject.description ? dustyComicProject.description.replace(/<br\s*\/?>/gi, ' ').substring(0, 150) + '...' : ''}</p>
                            <button class="view-details-btn" data-project-id="${dustyComicProject.id}">View Details →</button>
                        </div>
                    </div>
                </div>
            `;
        } else {
            // 普通单项目布局
            screen.innerHTML = `
                <div class="project-screen-content">
                    <div class="project-card-3d" data-card-index="${index}">
                        <img src="${project.image}" alt="${project.title}" loading="lazy" decoding="async" fetchpriority="${index === 0 ? 'high' : 'low'}">
                    </div>
                    <div class="project-info-overlay">
                        <h2 class="project-screen-title">${project.title}</h2>
                        <p class="project-screen-description">${project.description ? project.description.replace(/<br\s*\/?>/gi, ' ').substring(0, 200) + '...' : ''}</p>
                        <button class="view-details-btn" data-project-id="${project.id}">View Details →</button>
                    </div>
                </div>
            `;
        }
        
        fragment.appendChild(screen);
        
        // 在每个项目屏幕后添加媒体占位屏幕（除了最后一个项目）
        if (index < featuredProjects.length - 1) {
            const mediaScreen = document.createElement('section');
            mediaScreen.className = 'story-screen media-placeholder-screen';
            mediaScreen.dataset.mediaIndex = index;
            mediaScreen.dataset.screenIndex = (index * 2) + 2; // 偶数索引：2, 4, 6, 8...
            
            // 检查项目类型，添加对应的媒体内容
            const projectTitleLower = project.title.toLowerCase();
            const isLayoffProject = projectTitleLower.includes('layoff');
            const isDustyProject = projectTitleLower.includes('dusty');
            const isShadowBallProject = projectTitleLower.includes('shadow ball');
            const isCityQuestProject = projectTitleLower.includes('cityquest') || projectTitleLower.includes('city quest');
            const isKberKillProject = projectTitleLower.includes('kberkill');
            let mediaContent = '';
            
            if (isDustyProject) {
                // 为Dusty Memories项目添加图片和GIF
                mediaContent = `
                    <img src="dms1.png" alt="Dusty Memories 1" loading="lazy" decoding="async">
                    <img src="dms2.gif" alt="Dusty Memories 2" loading="lazy" decoding="async">
                    <img src="dms3.png" alt="Dusty Memories 3" loading="lazy" decoding="async">
                    <img src="dsm5.png" alt="Dusty Memories 4" loading="lazy" decoding="async">
                    <img src="dms6.png" alt="Dusty Memories 5" loading="lazy" decoding="async">
                `;
            } else if (isLayoffProject) {
                // 为Layoff项目添加5个GIF
                mediaContent = `
                    <img src="lssp1.GIF" alt="Layoff GIF 1" loading="lazy" decoding="async">
                    <img src="lssp2.GIF" alt="Layoff GIF 2" loading="lazy" decoding="async">
                    <img src="lssp3.GIF" alt="Layoff GIF 3" loading="lazy" decoding="async">
                    <img src="lssp4.GIF" alt="Layoff GIF 4" loading="lazy" decoding="async">
                    <img src="lssp5.GIF" alt="Layoff GIF 5" loading="lazy" decoding="async">
                `;
            } else if (isCityQuestProject) {
                // 为CityQuest项目添加图片和GIF
                mediaContent = `
                    <img src="cqv1.png" alt="CityQuest 1" loading="lazy" decoding="async">
                    <img src="cqv2.GIF" alt="CityQuest 2" loading="lazy" decoding="async">
                    <img src="cqv3.png" alt="CityQuest 3" loading="lazy" decoding="async">
                    <img src="cqv4.GIF" alt="CityQuest 4" loading="lazy" decoding="async">
                    <img src="cqv5.png" alt="CityQuest 5" loading="lazy" decoding="async">
                `;
            } else if (isKberKillProject) {
                // 为KberKill项目添加图片和GIF
                mediaContent = `
                    <img src="kkv1.png" alt="KberKill 1" loading="lazy" decoding="async">
                    <img src="kkv2.png" alt="KberKill 2" loading="lazy" decoding="async">
                    <img src="kkv3.gif" alt="KberKill 3" loading="lazy" decoding="async">
                    <img src="kkv4.png" alt="KberKill 4" loading="lazy" decoding="async">
                    <img src="kkv5.png" alt="KberKill 5" loading="lazy" decoding="async">
                `;
            } else if (isShadowBallProject) {
                // 为Shadow Ball项目添加黑色占位屏幕（暂时为空，可以后续添加内容）
                mediaContent = '';
            }
            
            mediaScreen.innerHTML = `
                <div class="media-placeholder-content" data-placeholder-index="${index}">
                    ${mediaContent}
                </div>
            `;
            
            fragment.appendChild(mediaScreen);
        }
    });
    
    // 一次性添加到容器，减少重排
    container.appendChild(fragment);
    
    console.log(`Created ${featuredProjects.length} featured project screens`);
    console.log('Screen indices:', Array.from(fragment.querySelectorAll('.project-screen')).map(s => ({
        title: s.dataset.projectId ? projectsData.projects.find(p => p.id == s.dataset.projectId)?.title : 'unknown',
        screenIndex: s.dataset.screenIndex
    })));
    
    // 绑定查看详情按钮
    container.querySelectorAll('.view-details-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const projectId = parseInt(e.target.dataset.projectId);
            if (window.navigateToProject) {
                window.navigateToProject(projectId);
            }
        });
    });
    
    // 如果是Dusty Memories并排布局，也绑定Comic项目的按钮
    if (dustyComicProject) {
        container.querySelectorAll(`.view-details-btn[data-project-id="${dustyComicProject.id}"]`).forEach(btn => {
            btn.addEventListener('click', (e) => {
                const projectId = parseInt(e.target.dataset.projectId);
                if (window.navigateToProject) {
                    window.navigateToProject(projectId);
                }
            });
        });
    }
    
    // 初始化卡片位置 - 立即执行，不延迟
    initCardPositions();
    
    // 初始化后立即显示第一个屏幕的卡片
    requestAnimationFrame(() => {
        const firstScreen = container.querySelector('.project-screen[data-screen-index="1"]');
        if (firstScreen) {
            const firstScreenIndex = parseInt(firstScreen.dataset.screenIndex);
            animateCardTransition(firstScreenIndex);
        }
    });
}

// 初始化背景漂浮卡片
function initFloatingCards() {
    const bgContainer = document.getElementById('floating-cards-bg');
    if (!bgContainer || !projectsData) return;
    
    // 限制背景卡片数量以提高性能（最多20个）
    const allProjects = projectsData.projects;
    const maxCards = 20;
    const selectedProjects = allProjects.length > maxCards 
        ? allProjects.sort(() => Math.random() - 0.5).slice(0, maxCards)
        : allProjects;
    
    // 创建共享的keyframes（只创建一次）
    if (!document.getElementById('dynamic-card-styles')) {
        const styleSheet = document.createElement('style');
        styleSheet.id = 'dynamic-card-styles';
        document.head.appendChild(styleSheet);
    }
    const styleSheet = document.getElementById('dynamic-card-styles');
    
    // 使用DocumentFragment批量创建，提高性能
    const fragment = document.createDocumentFragment();
    
    // 创建所有项目照片，随机位置、大小、重叠，缓慢淡入
    selectedProjects.forEach((project, index) => {
        const card = document.createElement('div');
        card.className = 'floating-card';
        card.dataset.cardIndex = index;
        
        const img = document.createElement('img');
        img.src = project.image;
        img.alt = project.title;
        img.loading = 'lazy';
        img.decoding = 'async';
        img.fetchpriority = 'low'; // 降低优先级
        card.appendChild(img);
        
        fragment.appendChild(card);
        
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
        
        // 使用共享的keyframes动画（优化性能）
        // 使用CSS变量来控制每个卡片的透明度
        card.style.setProperty('--final-opacity', finalOpacity);
        
        // 设置初始样式
        card.style.left = `${startX}%`;
        card.style.top = `${startY}%`;
        card.style.width = `${cardWidth}px`;
        card.style.height = `${cardHeight}px`;
        card.style.transform = `scale(${scale}) rotate(${rotation}deg)`;
        card.style.opacity = '0'; // 初始透明
        card.style.animationDelay = `${delay}s`;
        card.style.animationDuration = `${totalDuration}s`;
        card.style.animationName = 'fadeInOutCard'; // 使用共享动画
        card.style.animationIterationCount = 'infinite';
        card.style.animationTimingFunction = 'ease-in-out';
    });
    
    // 一次性添加到容器，减少重排
    bgContainer.appendChild(fragment);
    
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

// 初始化滚动snap - 使用 Intersection Observer 优化性能
function initScrollSnap() {
    const container = document.getElementById('home-page');
    if (!container) return;
    
    // 使用 Intersection Observer 替代滚动事件，性能更好
    const observerOptions = {
        root: container,
        rootMargin: '0px',
        threshold: [0.3, 0.5, 0.7] // 当屏幕可见30%、50%、70%时触发
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && entry.intersectionRatio >= 0.3) {
                const screen = entry.target;
                const screenIndex = parseInt(screen.dataset.screenIndex);
                if (screenIndex && screenIndex !== currentScreenIndex) {
                    currentScreenIndex = screenIndex;
                    // 使用 requestAnimationFrame 确保在下一帧执行
                    requestAnimationFrame(() => {
                        animateCardTransition(screenIndex);
                    });
                }
            }
        });
    }, observerOptions);
    
    // 观察所有项目屏幕
    const projectScreens = container.querySelectorAll('.project-screen');
    projectScreens.forEach(screen => {
        observer.observe(screen);
    });
    
    // 初始触发一次
    requestAnimationFrame(() => {
        const scrollTop = container.scrollTop;
        const screenHeight = window.innerHeight;
        const currentScreen = Math.floor(scrollTop / screenHeight + 0.5);
        currentScreenIndex = currentScreen;
        animateCardTransition(currentScreen);
    });
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
    
    // 检查是否是并排布局
    const isDualScreen = currentScreen.classList.contains('dual-project-screen');
    const cards = currentScreen.querySelectorAll('.project-card-3d');
    
    let currentCards = [];
    
    if (isDualScreen && cards.length === 2) {
        // 并排布局：同时显示两个卡片
        cards.forEach((card, idx) => {
            card.style.willChange = 'transform, opacity';
            card.style.transition = 'opacity 0.4s ease, transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
            card.style.transform = 'translate(0, 0) scale(1) rotateY(0deg) rotateX(0deg)';
            card.style.opacity = '1';
            card.style.zIndex = '1000';
            
            // 延迟添加鼠标移动3D效果
            setTimeout(() => {
                addCard3DEffect(card);
            }, 500);
        });
        
        currentCards = Array.from(cards);
        
        // 显示两个项目信息
        const infoOverlays = currentScreen.querySelectorAll('.project-info-overlay');
        infoOverlays.forEach(overlay => {
            overlay.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
            overlay.style.opacity = '1';
            overlay.style.transform = 'translateY(0)';
        });
    } else {
        // 单卡片布局
        const card = cards[0];
        if (!card) return;
        
        currentCards = [card];
        
        // 立即显示，不等待动画
        card.style.willChange = 'transform, opacity';
        card.style.transition = 'opacity 0.4s ease, transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
        card.style.transform = 'translate(0, 0) scale(1.2) rotateY(0deg) rotateX(0deg)';
        card.style.opacity = '1';
        card.style.zIndex = '1000';
        
        // 延迟添加鼠标移动3D效果，等待动画完成
        setTimeout(() => {
            addCard3DEffect(card);
        }, 500);
        
        // 显示项目信息 - 与卡片同时出现
        const infoOverlay = currentScreen.querySelector('.project-info-overlay');
        if (infoOverlay) {
            infoOverlay.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
            infoOverlay.style.opacity = '1';
            infoOverlay.style.transform = 'translateY(0)';
        }
    }
    
    // 处理其他屏幕的卡片 - 使用缓存的卡片列表优化性能
    if (!window.allProjectCards) {
        window.allProjectCards = Array.from(document.querySelectorAll('.project-card-3d'));
    }
    
    // 批量处理，减少重排
    requestAnimationFrame(() => {
        window.allProjectCards.forEach((otherCard) => {
            if (!currentCards.includes(otherCard)) {
                const otherScreen = otherCard.closest('.project-screen');
                if (!otherScreen) return;
                
                const otherScreenIndex = parseInt(otherScreen.dataset.screenIndex);
                if (isNaN(otherScreenIndex)) return;
                
                const offset = otherScreenIndex - screenIndex;
                
                // 使用 transform 和 opacity，避免触发 layout
                otherCard.style.willChange = 'transform, opacity';
                otherCard.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
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
                const otherOverlays = otherScreen.querySelectorAll('.project-info-overlay');
                otherOverlays.forEach(overlay => {
                    overlay.style.opacity = '0';
                    overlay.style.transform = 'translateY(30px)';
                });
            }
        });
    });
}

// 初始化时设置第一屏的卡片位置
function initCardPositions() {
    document.querySelectorAll('.project-card-3d').forEach((card, index) => {
        const screen = card.closest('.project-screen');
        if (!screen) return;
        
        const isDualScreen = screen.classList.contains('dual-project-screen');
        const screenIndex = parseInt(screen.dataset.screenIndex);
        const offset = screenIndex;
        
        if (isDualScreen) {
            // 并排布局：使用相对定位，不分散
            card.style.cssText = `
                position: relative;
                width: 100%;
                max-width: 500px;
                height: 400px;
                transform: scale(0.9) rotateY(0deg) rotateX(0deg);
                opacity: 0.3;
                transition: opacity 0.6s ease, transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
                transform-style: preserve-3d;
                cursor: pointer;
                will-change: transform;
            `;
        } else {
            // 单卡片布局：初始位置分散在屏幕外
            // 计算相对于第一个项目屏幕的偏移（screenIndex 1 是第一个项目）
            const relativeOffset = screenIndex - 1;
            card.style.cssText = `
                position: absolute;
                width: 600px;
                height: 400px;
                transform: translate(${relativeOffset * 200}px, ${relativeOffset * 100}px) scale(0.6) rotateY(${relativeOffset * 45}deg) rotateX(0deg);
                opacity: 0.3;
                transition: opacity 0.6s ease, transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
                transform-style: preserve-3d;
                cursor: pointer;
                will-change: transform;
            `;
        }
        
        // 初始隐藏信息（但并排布局的信息始终显示）
        const infoOverlays = screen.querySelectorAll('.project-info-overlay');
        infoOverlays.forEach(overlay => {
            if (isDualScreen) {
                // 并排布局：信息始终显示，不隐藏
                overlay.style.opacity = '1';
                overlay.style.transform = 'none';
            } else {
                // 单卡片布局：初始隐藏
                overlay.style.opacity = '0';
                overlay.style.transform = 'translateY(30px)';
                overlay.style.transition = 'all 0.8s ease-out';
            }
        });
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

