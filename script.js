import {
    handleCardClick,
    showProjectDetails,
    hideProjectDetails,
    filterCards,
    playSound
} from './cardModule.js';

import {
    initRouter,
    navigateToProject,
    showHomePage,
    getProjectIdFromCard
} from './router.js';

import { initSingleTrack } from './singleTrack.js';

// ============================================
// 检查是否是单轨叙事模式（必须在最前面）
// ============================================
const homePage = document.getElementById('home-page');
const isSingleTrack = homePage && homePage.classList.contains('single-track-container');

// ============================================
// 单轨叙事模式：跳过所有旧版代码
// ============================================
if (isSingleTrack) {
    console.log('Single track mode detected - skipping all legacy code');
    
    // 立即显示主页
    if (homePage) {
        homePage.style.display = 'block';
        homePage.style.visibility = 'visible';
        homePage.style.opacity = '1';
        homePage.style.zIndex = '10000';
    }
    
    // 隐藏顶部导航栏
    const topNavbar = document.querySelector('.top-navbar');
    if (topNavbar) {
        topNavbar.style.display = 'none';
    }
    
    // 设置body样式 - 添加类来隐藏遮罩层
    document.body.classList.add('single-track-mode');
    document.body.classList.add('loaded'); // 确保body::before遮罩消失
    document.body.style.paddingTop = '0';
    document.body.style.overflow = 'hidden';
    
    // 直接隐藏body::before（如果存在）
    const bodyBefore = window.getComputedStyle(document.body, '::before');
    if (bodyBefore) {
        document.body.style.setProperty('--before-display', 'none');
    }
    
    // 在DOMContentLoaded时初始化单轨叙事系统
    document.addEventListener('DOMContentLoaded', () => {
        console.log('DOMContentLoaded - initializing single track system');
        setTimeout(() => {
            initSingleTrack();
        }, 100);
        
        // 绑定导航栏点击事件
        initSingleTrackNav();
    });
    
    // 将路由函数暴露到全局（用于项目详情页）
    window.navigateToProject = navigateToProject;
    window.showHomePage = showHomePage;
    window.getProjectIdFromCard = getProjectIdFromCard;
    window.showProjectsGridView = showProjectsGridView;
    window.showArchivesGridView = showArchivesGridView;
    
    // 初始化单轨叙事导航栏
    function initSingleTrackNav() {
        // 项目链接 - 显示项目网格视图
        const projectsLink = document.querySelector('.nav-link-single[data-section="projects"]');
        if (projectsLink) {
            projectsLink.addEventListener('click', (e) => {
                e.preventDefault();
                showProjectsGridView();
            });
        }
        
        // 简历链接
        const resumeLink = document.querySelector('.nav-link-single[data-section="resume"]');
        if (resumeLink) {
            resumeLink.addEventListener('click', (e) => {
                e.preventDefault();
                // 下载简历
                const url = 'Xuanyi_Wang_Resume.png';
                const link = document.createElement('a');
                link.href = url;
                link.download = 'Xuanyi_Wang_Resume.png';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            });
        }
        
        // 归档链接 - 显示归档项目网格
        const archivesLink = document.querySelector('.nav-link-single[data-section="archives"]');
        if (archivesLink) {
            archivesLink.addEventListener('click', (e) => {
                e.preventDefault();
                showArchivesGridView();
            });
        }
        
        // 名字链接 - 回到顶部并隐藏所有网格视图
        const nameLink = document.getElementById('nav-home-link');
        if (nameLink) {
            nameLink.addEventListener('click', (e) => {
                e.preventDefault();
                hideProjectsGridView();
                hideArchivesGridView();
                const homePage = document.getElementById('home-page');
                if (homePage) {
                    homePage.style.display = 'block';
                    homePage.scrollTo({ top: 0, behavior: 'smooth' });
                }
            });
        }
    }
    
    // 显示项目网格视图
    function showProjectsGridView() {
        const gridView = document.getElementById('projects-grid-view');
        const homePage = document.getElementById('home-page');
        const projectPage = document.getElementById('project-page');
        const archivesView = document.getElementById('archives-grid-view');
        const nav = document.getElementById('single-track-nav');
        
        if (!gridView) {
            console.error('Projects grid view not found!');
            return;
        }
        
        // 隐藏其他视图
        if (homePage) {
            homePage.style.display = 'none';
        }
        if (projectPage) {
            projectPage.style.display = 'none';
        }
        if (archivesView) {
            archivesView.style.display = 'none';
        }
        
        // 确保导航栏显示
        if (nav) {
            nav.style.display = 'flex';
            nav.style.zIndex = '10003';
        }
        
        // 显示网格视图
        gridView.style.display = 'block';
        
        // 如果网格还没有内容，加载项目
        const grid = document.getElementById('projects-grid');
        if (grid && grid.children.length === 0) {
            loadProjectsGrid();
        }
        
        // 滚动到顶部
        setTimeout(() => {
            gridView.scrollTo({ top: 0, behavior: 'smooth' });
        }, 100);
    }
    
    // 隐藏项目网格视图
    function hideProjectsGridView() {
        const gridView = document.getElementById('projects-grid-view');
        const homePage = document.getElementById('home-page');
        
        if (gridView) {
            gridView.style.display = 'none';
        }
        
        if (homePage) {
            homePage.style.display = 'block';
        }
    }
    
    // 定义精选项目（与singleTrack.js保持一致）
    const featuredProjectTitles = [
        'shadow ball',
        'shadow play',
        'kberkill',
        'cityquest',
        'layoff',
        'dusty',
        'young wild and free'
    ];
    
    // 定义项目显示顺序
    const projectDisplayOrder = [
        'dusty memories',
        'city quest',
        'cityquest',
        'layoff',
        'layoffs',
        'kberkill',
        'shadow ball',
        'shadow play'
    ];
    
    function isFeaturedProject(projectTitle) {
        const titleLower = projectTitle.toLowerCase();
        return featuredProjectTitles.some(featured => titleLower.includes(featured));
    }
    
    function getProjectDisplayOrder(projectTitle) {
        const titleLower = projectTitle.toLowerCase();
        for (let i = 0; i < projectDisplayOrder.length; i++) {
            if (titleLower.includes(projectDisplayOrder[i])) {
                return i;
            }
        }
        return 999;
    }
    
    // 加载项目到网格（只显示精选项目）
    function loadProjectsGrid() {
        const grid = document.getElementById('projects-grid');
        if (!grid) return;
        
        fetch('data.json')
            .then(res => res.json())
            .then(data => {
                grid.innerHTML = '';
                
                // 只显示精选项目，并按指定顺序排序
                const featuredProjects = data.projects
                    .filter(project => isFeaturedProject(project.title))
                    .sort((a, b) => {
                        const orderA = getProjectDisplayOrder(a.title);
                        const orderB = getProjectDisplayOrder(b.title);
                        return orderA - orderB;
                    });
                
                featuredProjects.forEach(project => {
                    const gridItem = document.createElement('div');
                    gridItem.className = 'projects-grid-item';
                    gridItem.dataset.projectId = project.id;
                    
                    gridItem.innerHTML = `
                        <img src="${project.image}" alt="${project.title}" loading="lazy">
                        <div class="projects-grid-overlay">
                            <div class="projects-grid-title">${project.title}</div>
                            <div class="projects-grid-date">${project.date || ''}</div>
                        </div>
                    `;
                    
                    gridItem.addEventListener('click', () => {
                        if (window.navigateToProject) {
                            window.navigateToProject(project.id);
                        }
                    });
                    
                    grid.appendChild(gridItem);
                });
            })
            .catch(err => console.error('Failed to load projects for grid:', err));
    }
    
    // 显示归档项目网格视图
    function showArchivesGridView() {
        const archivesView = document.getElementById('archives-grid-view');
        const homePage = document.getElementById('home-page');
        const projectsView = document.getElementById('projects-grid-view');
        const projectPage = document.getElementById('project-page');
        const nav = document.getElementById('single-track-nav');
        
        if (!archivesView) {
            console.error('Archives grid view not found!');
            return;
        }
        
        // 隐藏其他视图
        if (homePage) {
            homePage.style.display = 'none';
        }
        if (projectsView) {
            projectsView.style.display = 'none';
        }
        if (projectPage) {
            projectPage.style.display = 'none';
        }
        
        // 确保导航栏显示
        if (nav) {
            nav.style.display = 'flex';
            nav.style.zIndex = '10003';
        }
        
        // 显示归档视图
        archivesView.style.display = 'block';
        
        // 如果还没有内容，加载归档项目
        const grid = document.getElementById('archives-grid');
        if (grid && grid.children.length === 0) {
            loadArchivesGrid();
        }
        
        setTimeout(() => {
            archivesView.scrollTo({ top: 0, behavior: 'smooth' });
        }, 100);
    }
    
    // 隐藏归档视图
    function hideArchivesGridView() {
        const archivesView = document.getElementById('archives-grid-view');
        if (archivesView) {
            archivesView.style.display = 'none';
        }
    }
    
    // 加载归档项目到网格
    function loadArchivesGrid() {
        const grid = document.getElementById('archives-grid');
        if (!grid) return;
        
        fetch('data.json')
            .then(res => res.json())
            .then(data => {
                grid.innerHTML = '';
                
                // 只显示非精选项目
                const archivedProjects = data.projects.filter(project => 
                    !isFeaturedProject(project.title)
                );
                
                archivedProjects.forEach(project => {
                    const gridItem = document.createElement('div');
                    gridItem.className = 'projects-grid-item';
                    gridItem.dataset.projectId = project.id;
                    
                    gridItem.innerHTML = `
                        <img src="${project.image}" alt="${project.title}" loading="lazy">
                        <div class="projects-grid-overlay">
                            <div class="projects-grid-title">${project.title}</div>
                            <div class="projects-grid-date">${project.date || ''}</div>
                        </div>
                    `;
                    
                    gridItem.addEventListener('click', () => {
                        if (window.navigateToProject) {
                            window.navigateToProject(project.id);
                        }
                    });
                    
                    grid.appendChild(gridItem);
                });
            })
            .catch(err => console.error('Failed to load archived projects:', err));
    }
    
    // 提前退出，不执行任何旧版代码
    // 注意：这里不能使用 return，因为这是模块顶层代码
    // 所以我们需要用 if-else 包裹所有旧版代码
} else {
    // ============================================
    // 传统模式：初始化旧版卡片系统
    // ============================================
    
const gallery = document.querySelector('.gallery');
let cards = document.querySelectorAll('.card');
const categoryButtons = document.querySelectorAll('.category-btn');
const projectDetails = document.getElementById('project-details');
const projectTitle = document.getElementById('project-title');
const projectImage = document.getElementById('project-image');
const projectDescription = document.getElementById('project-description');
const closeDetails = document.getElementById('close-details');

let currentIndex = 0;
let totalCards = cards.length;
const visibleCards = 15;

// 添加一个节流变量
let isScrolling = false;
let scrollTimeout = null;

// 节流函数实现
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

const layoutToggle = document.getElementById('layout-toggle');
let isMasonryLayout = false;

    if (layoutToggle) {
layoutToggle.addEventListener('click', () => {
    const gallery = document.querySelector('.gallery');
    isMasonryLayout = !isMasonryLayout;
    
    if (isMasonryLayout) {
        gallery.classList.add('masonry');
        gallery.removeEventListener('wheel', handleScroll);
        document.removeEventListener('mousemove', handleMouseMove);
    } else {
        gallery.classList.remove('masonry');
        // 只在非手机端添加滚轮和鼠标事件
        if (window.innerWidth > 480) {
        gallery.addEventListener('wheel', handleScroll, { passive: false });
            if (window.innerWidth > 1024) {
        document.addEventListener('mousemove', handleMouseMove);
            }
        }
        
        // 重新初始化卡片位置
        updateCardPositions();
    }
});
    }

// 瀑布流布局的无限滚动
function handleMasonryScroll() {
    if (!isMasonryLayout) return;
    
    const gallery = document.querySelector('.gallery');
        if (gallery && window.innerHeight + window.scrollY >= gallery.offsetHeight - 100) {
        loadMorePhotos();
    }
}

window.addEventListener('scroll', handleMasonryScroll);

function updateCardPositions() {
    cards = document.querySelectorAll('.card');
    const visibleCards = Array.from(cards).filter(card => card.style.display !== 'none');
    const totalVisible = visibleCards.length;
    if (window.currentIndex >= totalVisible) window.currentIndex = 0;
    
    // 手机端使用垂直列表布局
    const isMobile = window.innerWidth <= 480;
    
    visibleCards.forEach((card, index) => {
        const offset = index - window.currentIndex;
        
        if (isMobile && !isMasonryLayout) {
            // 手机端：垂直列表布局，移除所有3D效果
            card.style.transform = 'none';
            card.style.position = 'relative';
            card.style.zIndex = '1';
        } else if (window.innerWidth <= 1024 && !isMasonryLayout) {
            // iPad端：简化3D效果
            const translateX = offset * 80;
            const translateY = offset * 40;
            const translateZ = -Math.abs(offset) * 100;
            const scale = Math.abs(offset) === 0 ? 1.1 : 0.85;
            const transform = `
                translateX(${translateX}px)
                translateY(${translateY}px)
                translateZ(${translateZ}px)
                scale(${scale})
            `;
            card.style.transform = transform;
            card.style.zIndex = Math.abs(offset) === 0 ? 1000 : (totalVisible - Math.abs(offset) + 100);
            if (Math.abs(offset) === 0) {
                card.classList.add('active');
            } else {
                card.classList.remove('active');
            }
        } else {
            // 桌面端：保持原有3D效果
        const translateX = offset * 150;
        const translateY = offset * 75;
        const translateZ = -Math.abs(offset) * 200;
        const transform = `
            translateX(${translateX}px)
            translateY(${translateY}px)
            translateZ(${translateZ}px)
            scale(${Math.abs(offset) === 0 ? 1.2 : 0.8})
        `;
        card.style.transform = transform;
        card.style.zIndex = Math.abs(offset) === 0 ? 1000 : (totalVisible - Math.abs(offset) + 100);
        if (Math.abs(offset) === 0) {
            card.classList.add('active');
        } else {
            card.classList.remove('active');
            }
        }
    });
}

function handleScroll(event) {
    // 手机端不处理滚轮事件，使用原生滚动
    if (window.innerWidth <= 480 && !isMasonryLayout) {
        return;
    }
    
    event.preventDefault();
    isScrolling = true;
        
        if (scrollTimeout) {
            clearTimeout(scrollTimeout);
        }
        
    scrollTimeout = setTimeout(() => {
        isScrolling = false;
        }, 150);
        
        const delta = event.deltaY;
        if (Math.abs(delta) > 50) {
            if (delta > 0) {
                window.currentIndex = (window.currentIndex + 1) % totalCards;
            } else {
                window.currentIndex = (window.currentIndex - 1 + totalCards) % totalCards;
            }
    updateCardPositions();
        }
    }

// 初始化卡片位置
updateCardPositions();

// 标记鼠标是否在卡片上，用于禁用全局鼠标移动效果（暴露到全局）
window.isMouseOverCard = false;

// 节流鼠标移动事件处理 - 全局3D效果（当鼠标不在卡片上时）
const handleMouseMoveThrottled = throttle((e) => {
    // 如果鼠标在卡片上或在瀑布流模式，不处理全局3D效果
    if (window.isMouseOverCard || isMasonryLayout) return;
    
    const visibleCards = Array.from(cards).filter(card => card.style.display !== 'none');
    const totalVisible = visibleCards.length;
    if (totalVisible === 0) return;
    
    const mouseX = e.clientX / window.innerWidth - 0.5;
    const mouseY = e.clientY / window.innerHeight - 0.5;
    visibleCards.forEach((card, index) => {
        const offset = index - window.currentIndex;
        if (Math.abs(offset) === 0) return;
        const moveX = mouseX * 50 * Math.abs(offset);
        const moveY = mouseY * 30 * Math.abs(offset);
        const moveZ = -Math.abs(offset) * 200;
        const transform = `
            translateX(${offset * 150 + moveX}px)
            translateY(${offset * 75 + moveY}px)
            translateZ(${moveZ}px)
            scale(0.8)
        `;
        card.style.transform = transform;
        card.style.transition = 'transform 0.1s ease-out';
    });
}, 16); // 约60fps

// 添加鼠标移动事件处理
function handleMouseMove(e) {
    // 只在鼠标不在卡片上时处理全局3D效果
    // 移动端不处理鼠标移动效果
    if (!window.isMouseOverCard && !isMasonryLayout && window.innerWidth > 1024) {
        handleMouseMoveThrottled(e);
    }
}

// 初始添加鼠标移动事件监听（仅桌面端）
if (window.innerWidth > 1024) {
document.addEventListener('mousemove', handleMouseMove);
}

// 窗口大小改变时重新绑定事件
window.addEventListener('resize', () => {
    if (window.innerWidth > 1024) {
        document.addEventListener('mousemove', handleMouseMove);
    } else {
        document.removeEventListener('mousemove', handleMouseMove);
    }
});

// 添加鼠标离开时的重置效果
document.addEventListener('mouseleave', () => {
    const visibleCards = Array.from(cards).filter(card => card.style.display !== 'none');
    visibleCards.forEach((card, index) => {
        const offset = index - window.currentIndex;
        const transform = `
            translateX(${offset * 150}px)
            translateY(${offset * 75}px)
            translateZ(${-Math.abs(offset) * 200}px)
            scale(${Math.abs(offset) === 0 ? 1.2 : 0.8})
            rotateY(0deg)
            rotateX(0deg)
        `;
        card.style.transform = transform;
        card.style.transition = 'transform 0.3s ease-out';
    });
});

window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    cards.forEach((card, index) => {
        const offset = (index - currentIndex + totalCards) % totalCards;
        card.style.transform += `translateY(${scrollY * 0.1 * offset}px)`;
    });
});

let isDragging = false;
let startX, startY, startScrollLeft, startScrollTop;

    if (gallery) {
gallery.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX = e.pageX - gallery.offsetLeft;
    startY = e.pageY - gallery.offsetTop;
    startScrollLeft = gallery.scrollLeft;
    startScrollTop = gallery.scrollTop;
});

gallery.addEventListener('mouseleave', () => {
    isDragging = false;
});

gallery.addEventListener('mouseup', () => {
    isDragging = false;
});

gallery.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - gallery.offsetLeft;
    const y = e.pageY - gallery.offsetTop;
    const walkX = (x - startX) * 2;
    const walkY = (y - startY) * 2;
    gallery.scrollLeft = startScrollLeft - walkX;
    gallery.scrollTop = startScrollTop - walkY;
});
    }

    // 触摸滑动支持（移动端）
    let touchStartY = 0;
    let touchEndY = 0;
    let touchStartX = 0;
    let touchEndX = 0;
    let touchStartTime = 0;
    let touchTarget = null;
    const MIN_SWIPE_DISTANCE = 50; // 最小滑动距离
    const MAX_SWIPE_TIME = 300; // 最大滑动时间（毫秒）

    if (gallery) {
        gallery.addEventListener('touchstart', (e) => {
            // 手机端使用原生滚动，不处理触摸滑动切换
            if (isMasonryLayout || window.innerWidth <= 480) return;
            touchStartY = e.touches[0].clientY;
            touchStartX = e.touches[0].clientX;
            touchStartTime = Date.now();
            touchTarget = e.target;
        }, { passive: true });

        gallery.addEventListener('touchmove', (e) => {
            // 手机端使用原生滚动
            if (isMasonryLayout || window.innerWidth <= 480) return;
            // 如果滑动距离较大，阻止默认行为（避免页面滚动）
            if (Math.abs(e.touches[0].clientY - touchStartY) > 10) {
                // 检查是否在卡片上滑动
                const card = e.target.closest('.card');
                if (card) {
                    e.preventDefault();
                }
            }
        }, { passive: false });

        gallery.addEventListener('touchend', (e) => {
            // 手机端使用原生滚动，不处理触摸滑动切换
            if (isMasonryLayout || window.innerWidth <= 480) {
                touchTarget = null;
                return;
            }
            
            touchEndY = e.changedTouches[0].clientY;
            touchEndX = e.changedTouches[0].clientX;
            const touchEndTime = Date.now();
            const swipeDistanceY = touchStartY - touchEndY;
            const swipeDistanceX = touchStartX - touchEndX;
            const swipeTime = touchEndTime - touchStartTime;

            // 检查是否是垂直滑动（而不是水平滑动）
            const isVerticalSwipe = Math.abs(swipeDistanceY) > Math.abs(swipeDistanceX);
            
            // 检查是否是有效的垂直滑动
            if (isVerticalSwipe && Math.abs(swipeDistanceY) > MIN_SWIPE_DISTANCE && swipeTime < MAX_SWIPE_TIME) {
                // 检查是否点击在卡片上
                const card = touchTarget ? touchTarget.closest('.card') : null;
                if (!card) {
                    // 不在卡片上，执行滑动切换
                    e.preventDefault();
                    const fakeEvent = {
                        deltaY: swipeDistanceY > 0 ? 100 : -100,
                        preventDefault: () => {}
                    };
                    handleScroll(fakeEvent);
                }
                // 如果在卡片上，让点击事件处理（不阻止默认行为）
            }
            
            // 重置
            touchTarget = null;
        }, { passive: false });
    }

    // 只在非手机端添加滚轮事件
    if (gallery && window.innerWidth > 480) {
        gallery.addEventListener('wheel', handleScroll, {
            passive: false
        });
    }

    // 窗口大小改变时重新绑定
    window.addEventListener('resize', () => {
        if (gallery && window.innerWidth > 480 && !isMasonryLayout) {
            gallery.addEventListener('wheel', handleScroll, { passive: false });
        } else if (gallery) {
            gallery.removeEventListener('wheel', handleScroll);
        }
    });
    
    if (closeDetails) {
        closeDetails.addEventListener('click', hideProjectDetails);
    }

    document.addEventListener('DOMContentLoaded', () => {
    const gallery = document.querySelector('.gallery');
        if (gallery) {
            gallery.addEventListener('click', handleCardClick);
            gallery.addEventListener('mouseover', handleCardHover);
            gallery.addEventListener('mouseout', handleCardLeave);
        }
    });

// 动态加载 data.json 并渲染卡片
fetch('data.json')
  .then(res => res.json())
  .then(data => {
    const gallery = document.querySelector('.gallery');
    gallery.innerHTML = '';
    data.projects.forEach(project => {
      // 提取年份
      const yearMatch = project.date && project.date.match(/\b(202[2-5])\b/);
      const year = yearMatch ? yearMatch[1] : '';

      // 创建卡片
      const card = document.createElement('div');
      card.className = 'card';
      // 支持多分类：数组转JSON字符串
      if (Array.isArray(project.category)) {
        card.dataset.category = JSON.stringify(project.category);
      } else {
        card.dataset.category = project.category;
      }
      card.dataset.original = 'true';
      card.dataset.year = year;
          card.dataset.projectId = project.id; // 添加项目ID

      card.innerHTML = `
        <img data-src="${project.image}" src="" alt="${project.title}" loading="lazy" class="lazy-img">
        <div class="card-info">
          <h3>${project.title}</h3>
          <p>Category: ${project.category}</p>
          <p>Tags: ${project.tags ? project.tags.join(', ') : ''}</p>
          <p>${project.date || ''}</p>
        </div>
      `;
      gallery.appendChild(card);
    });
    // 渲染后初始化事件和3D
    updateCardPositions();
    bindCardEvents();
    bindFilterEvents();
    // 初始化懒加载
    setTimeout(() => {
        initLazyLoading();
        // 将懒加载函数暴露到全局,供其他模块使用
        window.initLazyLoading = initLazyLoading;
        }, 500);
      })
      .catch(err => console.error('Error loading projects:', err));

    // 绑定卡片事件
    function bindCardEvents() {
        const cards = document.querySelectorAll('.card');
        cards.forEach(card => {
            card.addEventListener('click', handleCardClick);
            card.addEventListener('mouseenter', mouseEnterHandler);
            card.addEventListener('mouseleave', mouseLeaveHandler);
        });
    }

    // 初始化路由
    initRouter();
    
    // 将路由函数暴露到全局
    window.navigateToProject = navigateToProject;
    window.showHomePage = showHomePage;
    window.getProjectIdFromCard = getProjectIdFromCard;
}

// SPA导航逻辑（两种模式都需要）
const mainContent = document.getElementById('main-content');
const navLinks = document.querySelectorAll('.nav-link');
const homeLink = document.getElementById('home-link');
const templates = {
    about: document.getElementById('about-page')?.innerHTML || '',
    contact: document.getElementById('contact-page')?.innerHTML || '',
    instagram: document.getElementById('instagram-page')?.innerHTML || ''
};

navLinks.forEach(link => {
  link.addEventListener('click', function(e) {
    e.preventDefault();
    const page = link.dataset.page;
        if (templates[page] && mainContent) {
      mainContent.innerHTML = templates[page];
    }
  });
});

if (homeLink) {
homeLink.addEventListener('click', function() {
        if (window.showHomePage) {
            window.showHomePage();
        } else {
            window.location.reload();
        }
    });
}

// 强制下载Resume图片
document.addEventListener('DOMContentLoaded', function() {
  const resumeBtn = document.getElementById('resume-download');
  if (resumeBtn) {
    resumeBtn.addEventListener('click', function(e) {
      e.preventDefault();
      const url = 'Xuanyi_Wang_Resume.png';
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Xuanyi_Wang_Resume.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  }
});

// Projects按钮点击回到主页面
document.addEventListener('DOMContentLoaded', function() {
  const projectsBtn = document.getElementById('projects-link');
  if (projectsBtn) {
    projectsBtn.addEventListener('click', function(e) {
      e.preventDefault();
            if (window.showHomePage) {
                window.showHomePage();
            } else {
                window.location.hash = '';
      window.location.reload();
            }
    });
  }
});
