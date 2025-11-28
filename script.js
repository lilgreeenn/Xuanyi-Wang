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

// 瀑布流布局的无限滚动
function handleMasonryScroll() {
    if (!isMasonryLayout) return;
    
    const gallery = document.querySelector('.gallery');
    if (window.innerHeight + window.scrollY >= gallery.offsetHeight - 100) {
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
            card.classList.remove('active');
            // 所有卡片都显示，按顺序排列
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
    if (isScrolling) return;
    isScrolling = true;
    const visibleCards = Array.from(cards).filter(card => card.style.display !== 'none');
    const totalVisible = visibleCards.length;
    if (totalVisible === 0) return;
    const delta = Math.sign(event.deltaY);
    window.currentIndex = (window.currentIndex + delta + totalVisible) % totalVisible;
    updateCardPositions();

    // 3D堆叠模式下无限加载
    if (!isMasonryLayout && window.currentIndex >= totalVisible - 3) {
        loadMorePhotos();
        setTimeout(updateCardPositions, 100); // 等新卡片插入后再排列
    }

    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
        isScrolling = false;
    }, 100);
}

function handleCardHover(event) {
    const card = event.target.closest('.card');
    // 只对 active 卡片响应 hover
    if (!card || !card.classList.contains('active')) return;
    card.classList.add('hover');
    event.stopPropagation();
}

function handleCardLeave(event) {
    const card = event.target.closest('.card');
    // 只对 active 卡片响应 hover
    if (!card || !card.classList.contains('active')) return;
    card.classList.remove('hover');
}

function loadMorePhotos() {
    const cardContainer = document.querySelector('.card-container');
    if (!cardContainer) return;
    // 只克隆原始卡片
    const originalCards = Array.from(document.querySelectorAll('.card[data-original="true"]'));
    if (originalCards.length === 0) return;
    // 克隆所有原始卡片
    originalCards.forEach(card => {
        const newCard = card.cloneNode(true);
        newCard.dataset.original = 'false'; // 标记为克隆
        cardContainer.appendChild(newCard);
    });
    // 关键：每次都重新获取cards并绑定事件
    bindCardEvents();
    totalCards = cards.length;
    updateCardPositions();
    // 初始化新加载卡片的懒加载
    setTimeout(() => initLazyLoading(), 100);
}

// 更新事件监听器
document.addEventListener('DOMContentLoaded', () => {
    const gallery = document.querySelector('.gallery');
    if (gallery) {
        gallery.addEventListener('click', handleCardClick);
        gallery.addEventListener('mouseover', handleCardHover);
        gallery.addEventListener('mouseout', handleCardLeave);
    }
});

// 只在非手机端添加滚轮事件
if (window.innerWidth > 480) {
gallery.addEventListener('wheel', handleScroll, {
    passive: false
    });
}

// 窗口大小改变时重新绑定
window.addEventListener('resize', () => {
    if (window.innerWidth > 480 && !isMasonryLayout) {
        gallery.addEventListener('wheel', handleScroll, { passive: false });
    } else {
        gallery.removeEventListener('wheel', handleScroll);
    }
});
closeDetails.addEventListener('click', hideProjectDetails);

// 触摸滑动支持（移动端）
let touchStartY = 0;
let touchEndY = 0;
let touchStartX = 0;
let touchEndX = 0;
let touchStartTime = 0;
let touchTarget = null;
const MIN_SWIPE_DISTANCE = 50; // 最小滑动距离
const MAX_SWIPE_TIME = 300; // 最大滑动时间（毫秒）

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

// 动轮播
// setInterval(() => {
//     currentIndex = (currentIndex + 1) % totalCards;
//     updateCardPositions();
// }, 5000);

window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    cards.forEach((card, index) => {
        const offset = (index - currentIndex + totalCards) % totalCards;
        card.style.transform += `translateY(${scrollY * 0.1 * offset}px)`;
    });
});

let isDragging = false;
let startX, startY, startScrollLeft, startScrollTop;

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

window.addEventListener('load', () => {
    document.body.classList.add('loaded');
    // 初始化鼠标轨迹效果
    initCursorTrail();
});

// ========== 鼠标轨迹效果 - 线条版 ==========
function initCursorTrail() {
    // 只在桌面端启用
    if (window.innerWidth <= 1024) return;
    
    const trailContainer = document.getElementById('cursor-trail');
    if (!trailContainer) return;
    
    // 创建SVG容器
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    
    // 创建渐变定义 - 简洁单色
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    gradient.setAttribute('id', 'trailGradient');
    gradient.setAttribute('x1', '0%');
    gradient.setAttribute('y1', '0%');
    gradient.setAttribute('x2', '100%');
    gradient.setAttribute('y2', '0%');
    
    const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop1.setAttribute('offset', '0%');
    stop1.setAttribute('class', 'trail-gradient');
    
    const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop2.setAttribute('offset', '100%');
    stop2.setAttribute('class', 'trail-gradient-end');
    
    gradient.appendChild(stop1);
    gradient.appendChild(stop2);
    defs.appendChild(gradient);
    svg.appendChild(defs);
    trailContainer.appendChild(svg);
    
    // 创建主光标
    const cursorMain = document.createElement('div');
    cursorMain.className = 'cursor-main';
    document.body.appendChild(cursorMain);
    
    let mouseX = 0;
    let mouseY = 0;
    let cursorX = 0;
    let cursorY = 0;
    let points = []; // 存储轨迹点
    let path = null; // 当前路径
    let lastPoint = null;
    let isDrawing = false;
    const MAX_POINTS = 20; // 每条轨迹的最大点数
    const POINT_DISTANCE = 3; // 点之间的最小距离
    
    // 更新鼠标位置
    const handleMouseMove = (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        
        // 平滑跟随主光标
        const updateCursor = () => {
            cursorX += (mouseX - cursorX) * 0.15;
            cursorY += (mouseY - cursorY) * 0.15;
            cursorMain.style.left = cursorX + 'px';
            cursorMain.style.top = cursorY + 'px';
            
            if (Math.abs(mouseX - cursorX) > 0.5 || Math.abs(mouseY - cursorY) > 0.5) {
                requestAnimationFrame(updateCursor);
            }
        };
        updateCursor();
        
        // 检查距离，决定是否添加新点
        if (!lastPoint || 
            Math.sqrt(Math.pow(mouseX - lastPoint.x, 2) + Math.pow(mouseY - lastPoint.y, 2)) > POINT_DISTANCE) {
            addPoint(mouseX, mouseY);
        }
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    
    // 添加轨迹点
    function addPoint(x, y) {
        const point = { x, y, time: Date.now() };
        
        if (!isDrawing) {
            // 开始新路径
            startNewPath();
            isDrawing = true;
        }
        
        points.push(point);
        lastPoint = point;
        
        // 更新路径
        updatePath();
        
        // 限制点数
        if (points.length > MAX_POINTS) {
            points.shift();
        }
        
        // 如果点数过多，创建新路径
        if (points.length >= MAX_POINTS) {
            finishPath();
            startNewPath();
            points = [point];
            lastPoint = point;
        }
    }
    
    // 开始新路径
    function startNewPath() {
        path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('class', 'trail-path');
        svg.appendChild(path);
    }
    
    // 更新路径 - 简洁平滑
    function updatePath() {
        if (!path || points.length < 2) return;
        
        let d = '';
        
        if (points.length === 2) {
            // 只有两个点时直接连线
            d = `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
        } else if (points.length === 3) {
            // 三个点时使用二次贝塞尔曲线
            d = `M ${points[0].x} ${points[0].y} Q ${points[1].x} ${points[1].y} ${points[2].x} ${points[2].y}`;
        } else {
            // 多个点时使用平滑的曲线连接
            d = `M ${points[0].x} ${points[0].y}`;
            
            for (let i = 1; i < points.length; i++) {
                const prev = points[i - 1];
                const curr = points[i];
                
                if (i === 1) {
                    // 第一个线段，使用二次贝塞尔曲线
                    const next = points[i + 1] || curr;
                    const cpX = curr.x;
                    const cpY = curr.y;
                    const endX = (curr.x + next.x) / 2;
                    const endY = (curr.y + next.y) / 2;
                    d += ` Q ${cpX} ${cpY} ${endX} ${endY}`;
                } else if (i < points.length - 1) {
                    // 中间点，使用平滑的二次贝塞尔曲线
                    const next = points[i + 1];
                    const cpX = curr.x;
                    const cpY = curr.y;
                    const endX = (curr.x + next.x) / 2;
                    const endY = (curr.y + next.y) / 2;
                    d += ` Q ${cpX} ${cpY} ${endX} ${endY}`;
                } else {
                    // 最后一个点，直接连接到实际位置
                    d += ` L ${curr.x} ${curr.y}`;
                }
            }
        }
        
        path.setAttribute('d', d);
    }
    
    // 完成路径（开始淡出）
    function finishPath() {
        if (path) {
            // 路径会自动淡出（通过CSS动画）
            setTimeout(() => {
                if (path && path.parentNode) {
                    path.parentNode.removeChild(path);
                }
            }, 1500);
        }
    }
    
    // 鼠标停止移动时完成当前路径
    let moveTimeout = null;
    document.addEventListener('mousemove', () => {
        clearTimeout(moveTimeout);
        moveTimeout = setTimeout(() => {
            if (isDrawing && points.length > 0) {
                finishPath();
                isDrawing = false;
                points = [];
                lastPoint = null;
            }
        }, 100);
    });
    
    // 悬停效果
    const updateHoverElements = () => {
        const hoverElements = document.querySelectorAll('a, button, .card, .nav-link, .category-btn, .year-btn, .menu-trigger, .layout-toggle-btn');
        hoverElements.forEach(el => {
            el.addEventListener('mouseenter', () => {
                cursorMain.classList.add('hover');
            });
            el.addEventListener('mouseleave', () => {
                cursorMain.classList.remove('hover');
            });
        });
    };
    
    // 初始绑定
    updateHoverElements();
    
    // 动态内容加载后重新绑定
    const observer = new MutationObserver(() => {
        updateHoverElements();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    
    // 点击效果 - 简洁
    document.addEventListener('mousedown', () => {
        cursorMain.classList.add('click');
    });
    document.addEventListener('mouseup', () => {
        cursorMain.classList.remove('click');
    });
    
    // 鼠标离开窗口时隐藏
    document.addEventListener('mouseleave', () => {
        cursorMain.style.opacity = '0';
        if (isDrawing) {
            finishPath();
            isDrawing = false;
            points = [];
            lastPoint = null;
        }
    });
    document.addEventListener('mouseenter', () => {
        cursorMain.style.opacity = '1';
    });
    
    // 窗口大小改变时重新检查
    window.addEventListener('resize', () => {
        if (window.innerWidth <= 1024) {
            cursorMain.style.display = 'none';
            trailContainer.style.display = 'none';
        } else {
            cursorMain.style.display = 'block';
            trailContainer.style.display = 'block';
        }
    });
}

// 懒加载图片实现 - 使用 Intersection Observer
function initLazyLoading() {
    // 检查浏览器是否支持 Intersection Observer
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        // 添加淡入效果
                        img.style.opacity = '0';
                        img.style.transition = 'opacity 0.3s ease-in';
                        img.src = img.dataset.src;
                        img.onload = () => {
                            img.style.opacity = '1';
                            img.classList.remove('lazy-img');
                            img.classList.add('loaded');
                        };
                        img.onerror = () => {
                            img.style.opacity = '1';
                            img.classList.add('error');
                        };
                        // 移除 data-src 属性，停止观察
                        img.removeAttribute('data-src');
                        observer.unobserve(img);
                    }
                }
            });
        }, {
            // 提前200px开始加载
            rootMargin: '200px',
            threshold: 0.01
        });

        // 观察所有懒加载图片
        const lazyImages = document.querySelectorAll('img.lazy-img[data-src]');
        lazyImages.forEach(img => imageObserver.observe(img));

        return imageObserver;
    } else {
        // 降级方案：不支持 Intersection Observer 的浏览器
        const lazyImages = document.querySelectorAll('img.lazy-img[data-src]');
        lazyImages.forEach(img => {
            img.src = img.dataset.src;
            img.classList.remove('lazy-img');
        });
    }
}

// 加载单个图片的辅助函数
function loadImage(img) {
    if (img && img.dataset && img.dataset.src) {
        img.style.opacity = '0';
        img.style.transition = 'opacity 0.3s ease-in';
        const imgSrc = img.dataset.src;
        img.src = imgSrc;
        img.onload = () => {
            img.style.opacity = '1';
            if (img.classList) {
                img.classList.remove('lazy-img');
                img.classList.add('loaded');
            }
            img.removeAttribute('data-src');
        };
        img.onerror = () => {
            img.style.opacity = '1';
            if (img.classList) {
                img.classList.add('error');
            }
        };
    } else if (img && img.src) {
        // 如果已经有src,直接标记为已加载
        if (img.classList) {
            img.classList.add('loaded');
        }
    }
}

// 监听滚动事件，加载更多照片
window.addEventListener('scroll', () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100) {
        loadMorePhotos();
    }
});

// 添加事件监听器
cards.forEach(card => {
    card.addEventListener('mouseenter', () => {
        card.classList.add('highlight');
    });

    card.addEventListener('mouseleave', () => {
        card.classList.remove('highlight');
    });
});

updateCardPositions();

// 新增：全局保存当前筛选条件
let currentCategory = 'all';
let currentYear = 'all';

function filterCardsByCategoryAndYear() {
    const gallery = document.querySelector('.gallery');
    if (!gallery) return;
    // 1. 先移除所有克隆出来的卡片，只保留最初的原始卡片
    const allCards = Array.from(gallery.querySelectorAll('.card'));
    allCards.forEach(card => {
        if (card.dataset.original !== 'true') {
            card.remove();
        }
    });

    // 2. 只对原始卡片做筛选
    const originalCards = Array.from(gallery.querySelectorAll('.card')).filter(card => card.dataset.original === 'true');
    originalCards.forEach(card => {
        let show = true;
        if (currentCategory !== 'all') {
            // 支持多分类（数组）
            try {
                const cat = JSON.parse(card.dataset.category);
                if (Array.isArray(cat)) {
                    show = cat.includes(currentCategory);
                } else {
                    show = cat === currentCategory;
                }
            } catch {
                show = card.dataset.category === currentCategory;
            }
        }
        if (show && currentYear !== 'all') {
            const info = card.querySelector('.card-info');
            if (info && info.innerText.match(/\b(202[2-5])\b/)) {
                const year = info.innerText.match(/\b(202[2-5])\b/)[1];
                show = year === currentYear;
            } else {
                show = false;
            }
        }
        card.style.display = show ? 'block' : 'none';
    });

    // 3. 补足到15张
    let visibleCards = Array.from(gallery.querySelectorAll('.card')).filter(card => card.style.display !== 'none');
    while (visibleCards.length < 15 && visibleCards.length > 0) {
        loadMorePhotos();
        visibleCards = Array.from(gallery.querySelectorAll('.card')).filter(card => card.style.display !== 'none');
    }

    // 4. 重新获取cards并绑定事件
    bindCardEvents();
    // 5. 重新排列3D
    if (typeof window.updateCardPositions === 'function') {
        window.currentIndex = 0;
        window.updateCardPositions();
    }
}

function bindFilterEvents() {
    const categoryButtons = document.querySelectorAll('.category-btn');
    const yearButtons = document.querySelectorAll('.year-btn');
    const allBtn = document.querySelector('.menu-trigger');
    const menuContent = document.querySelector('.menu-content');
    const categoriesMenu = document.querySelector('.categories-menu');
    const isMobile = window.innerWidth <= 480;

    // 手机端：点击触发按钮切换菜单显示
    if (isMobile && allBtn && menuContent) {
        allBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = menuContent.style.display === 'block' || menuContent.classList.contains('show');
            if (isOpen) {
                menuContent.style.display = 'none';
                menuContent.classList.remove('show');
            } else {
                menuContent.style.display = 'block';
                menuContent.classList.add('show');
            }
        });

        // 点击外部关闭菜单
        document.addEventListener('click', (e) => {
            if (isMobile && categoriesMenu && !categoriesMenu.contains(e.target)) {
                menuContent.style.display = 'none';
                menuContent.classList.remove('show');
            }
        });
    }

    // 分类按钮
    categoryButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            currentCategory = button.dataset.category;
            filterCardsByCategoryAndYear();
            // 手机端选择后关闭菜单
            if (isMobile && menuContent) {
                menuContent.style.display = 'none';
                menuContent.classList.remove('show');
            }
        });
    });

    // 年份按钮
    yearButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            yearButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            currentYear = button.dataset.year;
            filterCardsByCategoryAndYear();
            // 手机端选择后关闭菜单
            if (isMobile && menuContent) {
                menuContent.style.display = 'none';
                menuContent.classList.remove('show');
            }
        });
    });

    // All按钮（非手机端或作为重置按钮）
    if (allBtn) {
        const handleAllClick = (e) => {
            e.stopPropagation();
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            yearButtons.forEach(btn => btn.classList.remove('active'));
            currentCategory = 'all';
            currentYear = 'all';
            filterCardsByCategoryAndYear();
            // 手机端选择后关闭菜单
            if (isMobile && menuContent) {
                menuContent.style.display = 'none';
                menuContent.classList.remove('show');
            }
        };
        
        // 只在非手机端或菜单内容中点击时触发重置
        if (!isMobile) {
            allBtn.addEventListener('click', handleAllClick);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    bindFilterEvents();
    // 初始化懒加载
    if (typeof initLazyLoading === 'function') {
        setTimeout(() => {
            initLazyLoading();
            window.initLazyLoading = initLazyLoading;
            window.loadImage = loadImage;
        }, 100);
    }
});

window.updateCardPositions = updateCardPositions;
window.currentIndex = currentIndex;

// 确保updateCardPositions在cardModule.js中可用
if (typeof window !== 'undefined') {
    window.updateCardPositions = updateCardPositions;
}

// 重新绑定所有卡片的事件
function bindCardEvents() {
    cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        // 移除旧的事件监听器
        const oldMouseEnter = card._oldMouseEnter;
        const oldMouseLeave = card._oldMouseLeave;
        if (oldMouseEnter) card.removeEventListener('mouseenter', oldMouseEnter);
        if (oldMouseLeave) card.removeEventListener('mouseleave', oldMouseLeave);
        
        // 创建新的事件处理函数，设置标志位
        const mouseEnterHandler = (e) => {
            window.isMouseOverCard = true;
            handleCardHover(e);
        };
        
        const mouseLeaveHandler = (e) => {
            window.isMouseOverCard = false;
            handleCardLeave(e);
            // 鼠标离开卡片时，恢复卡片位置
            const visibleCards = Array.from(cards).filter(c => c.style.display !== 'none');
            const index = visibleCards.indexOf(card);
            if (index !== -1) {
                const offset = index - window.currentIndex;
                const transform = `
                    translateX(${offset * 150}px)
                    translateY(${offset * 75}px)
                    translateZ(${-Math.abs(offset) * 200}px)
                    scale(${Math.abs(offset) === 0 ? 1.2 : 0.8})
                `;
                card.style.transform = transform;
                card.style.transition = 'transform 0.3s ease-out';
            }
        };
        
        // 保存引用以便下次移除
        card._oldMouseEnter = mouseEnterHandler;
        card._oldMouseLeave = mouseLeaveHandler;
        
        // 绑定事件
        card.addEventListener('click', handleCardClick);
        card.addEventListener('mouseenter', mouseEnterHandler);
        card.addEventListener('mouseleave', mouseLeaveHandler);
    });
}

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
        window.loadImage = loadImage;
    }, 100);
  });

// 灯箱弹窗HTML（只添加一次）
let openLightbox; // 声明全局变量
(function() {
    if (document.getElementById('lightbox-modal')) return;
    const lightbox = document.createElement('div');
    lightbox.id = 'lightbox-modal';
    lightbox.style.cssText = `
      display:none; position:fixed; z-index:99999; left:0; top:0; width:100vw; height:100vh;
      background:rgba(0,0,0,0.92); justify-content:center; align-items:center;
    `;
    lightbox.innerHTML = `
      <button id="lightbox-prev" style="position:absolute;left:40px;top:50%;transform:translateY(-50%);font-size:2.5rem;color:#fff;background:none;border:none;cursor:pointer;z-index:2;">&#8592;</button>
      <img id="lightbox-img" style="max-width:99vw;max-height:99vh;object-fit:contain;display:block;margin:auto;border-radius:12px;box-shadow:0 8px 32px #000;" />
      <button id="lightbox-next" style="position:absolute;right:40px;top:50%;transform:translateY(-50%);font-size:2.5rem;color:#fff;background:none;border:none;cursor:pointer;z-index:2;">&#8594;</button>
      <button id="lightbox-close" style="position:absolute;top:32px;right:48px;font-size:2.2rem;color:#fff;background:none;border:none;cursor:pointer;z-index:2;">&#10005;</button>
    `;
    document.body.appendChild(lightbox);
  
    let galleryImages = [];
    let currentImgIndex = 0;
  
    openLightbox = function(images, index) {
      galleryImages = images;
      currentImgIndex = index;
      document.getElementById('lightbox-img').src = galleryImages[currentImgIndex].src;
      lightbox.style.display = 'flex';
    };
  
    function closeLightbox() {
      lightbox.style.display = 'none';
    }
  
    function showPrevImg() {
      if (galleryImages.length === 0) return;
      currentImgIndex = (currentImgIndex - 1 + galleryImages.length) % galleryImages.length;
      document.getElementById('lightbox-img').src = galleryImages[currentImgIndex].src;
    }
  
    function showNextImg() {
      if (galleryImages.length === 0) return;
      currentImgIndex = (currentImgIndex + 1) % galleryImages.length;
      document.getElementById('lightbox-img').src = galleryImages[currentImgIndex].src;
    }
  
    document.getElementById('lightbox-close').onclick = closeLightbox;
    document.getElementById('lightbox-prev').onclick = showPrevImg;
    document.getElementById('lightbox-next').onclick = showNextImg;
  
    // ESC关闭和方向键切换
    document.addEventListener('keydown', function(e) {
      if (lightbox.style.display === 'flex') {
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') showPrevImg();
        if (e.key === 'ArrowRight') showNextImg();
      }
    });
  })();

window.openLightbox = openLightbox;

// ... existing code ...

navLinks.forEach(link => {
  link.addEventListener('click', function(e) {
    e.preventDefault();
    const page = link.dataset.page;
    if (templates[page]) {
      mainContent.innerHTML = templates[page];
      if(page === 'about') {
        document.body.classList.add('about-fixed');
      } else {
        document.body.classList.remove('about-fixed');
      }
    }
  });
});
homeLink.addEventListener('click', function() {
  document.body.classList.remove('about-fixed');
  window.location.reload(); // 回到作品集主页面
});

// 强制下载Resume图片
document.addEventListener('DOMContentLoaded', function() {
  const resumeBtn = document.getElementById('resume-download');
  if (resumeBtn) {
    resumeBtn.addEventListener('click', function(e) {
      e.preventDefault();
      const url = 'Xuanyi.png';
      const link = document.createElement('a');
      link.href = url;
      link.download = 'XuanyiWang_Resume.png';
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
      document.body.classList.remove('about-fixed');
      if (window.showHomePage) {
        window.showHomePage();
      } else {
        window.location.reload();
      }
    });
  }

  // 返回按钮事件
  const backBtn = document.getElementById('back-to-home');
  if (backBtn) {
    backBtn.addEventListener('click', function(e) {
      e.preventDefault();
      if (window.showHomePage) {
        window.showHomePage();
      } else {
        window.location.hash = '';
        window.location.reload();
      }
    });
  }

  // 初始化路由
  initRouter();
  
  // 将路由函数暴露到全局
  window.navigateToProject = navigateToProject;
  window.showHomePage = showHomePage;
  window.getProjectIdFromCard = getProjectIdFromCard;
});