// 荧光绿色鼠标拖尾效果
(function() {
    'use strict';
    
    // 只在桌面端启用
    if (window.innerWidth <= 1024) {
        return;
    }
    
    const trailContainer = document.getElementById('cursor-trail');
    if (!trailContainer) return;
    
    // 创建SVG元素
    let svg = trailContainer.querySelector('svg');
    if (!svg) {
        svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        trailContainer.appendChild(svg);
    }
    
    // 鼠标位置历史记录
    const points = [];
    const maxPoints = 50; // 增加点数，让线条更连续
    let pathElement = null;
    let animationFrame = null;
    let lastMouseX = 0;
    let lastMouseY = 0;
    let isScrolling = false;
    let scrollTimeout = null;
    
    // 荧光绿色
    const neonGreen = '#00ff88';
    const neonGreenGlow = 'rgba(0, 255, 136, 0.8)';
    
    // 创建或更新路径元素
    function updatePath() {
        if (points.length < 2) return;
        
        // 如果路径不存在，创建它
        if (!pathElement) {
            pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            pathElement.setAttribute('fill', 'none');
            pathElement.setAttribute('stroke', neonGreen);
            pathElement.setAttribute('stroke-width', '2.5');
            pathElement.setAttribute('stroke-linecap', 'round');
            pathElement.setAttribute('stroke-linejoin', 'round');
            pathElement.style.filter = 'drop-shadow(0 0 6px ' + neonGreenGlow + ') drop-shadow(0 0 12px rgba(0, 255, 136, 0.4))';
            svg.appendChild(pathElement);
        }
        
        // 构建路径字符串 - 使用平滑的二次贝塞尔曲线
        let pathData = '';
        if (points.length === 2) {
            // 只有两个点时，使用直线
            pathData = `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
        } else if (points.length === 3) {
            // 三个点时，使用二次贝塞尔曲线
            pathData = `M ${points[0].x} ${points[0].y} Q ${points[1].x} ${points[1].y} ${points[2].x} ${points[2].y}`;
        } else {
            // 多个点时，使用平滑的二次贝塞尔曲线连接
            pathData = `M ${points[0].x} ${points[0].y}`;
            for (let i = 1; i < points.length - 1; i++) {
                const currentPoint = points[i];
                const nextPoint = points[i + 1];
                const controlX = currentPoint.x;
                const controlY = currentPoint.y;
                const endX = (currentPoint.x + nextPoint.x) / 2;
                const endY = (currentPoint.y + nextPoint.y) / 2;
                pathData += ` Q ${controlX} ${controlY} ${endX} ${endY}`;
            }
            // 连接到最后一个点
            const lastPoint = points[points.length - 1];
            pathData += ` L ${lastPoint.x} ${lastPoint.y}`;
        }
        
        pathElement.setAttribute('d', pathData);
        
        // 根据点的位置设置渐变透明度（尾部更透明）
        const opacity = Math.min(1, 1 - (points.length / maxPoints) * 0.3);
        pathElement.setAttribute('opacity', opacity);
    }
    
    // 更新拖尾
    function updateTrail(x, y) {
        // 更新最后鼠标位置
        lastMouseX = x;
        lastMouseY = y;
        
        // 添加新点
        points.push({ x, y, time: Date.now() });
        
        // 限制点数
        if (points.length > maxPoints) {
            points.shift();
        }
        
        // 移除过期的点（超过600ms）
        const now = Date.now();
        while (points.length > 0 && now - points[0].time > 600) {
            points.shift();
        }
        
        // 如果点被移除了，需要重新创建路径
        if (points.length === 0) {
            if (pathElement && pathElement.parentNode) {
                pathElement.parentNode.removeChild(pathElement);
                pathElement = null;
            }
            return;
        }
        
        // 更新路径
        updatePath();
    }
    
    // 清空拖尾
    function clearTrail() {
        if (pathElement && pathElement.parentNode) {
            pathElement.parentNode.removeChild(pathElement);
            pathElement = null;
        }
        points.length = 0;
    }
    
    // 节流函数
    function throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
    
    // 鼠标移动处理（减少节流，让线条更连续）
    const handleMouseMove = throttle((e) => {
        if (animationFrame) {
            cancelAnimationFrame(animationFrame);
        }
        
        animationFrame = requestAnimationFrame(() => {
            updateTrail(e.clientX, e.clientY);
        });
    }, 8); // 更频繁的更新，约120fps
    
    // 添加全局鼠标移动监听
    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    
    // 处理滚动事件 - 滚动时快速清理旧点，避免卡住
    const handleScroll = (e) => {
        isScrolling = true;
        
        // 清除之前的定时器
        if (scrollTimeout) {
            clearTimeout(scrollTimeout);
        }
        
        // 滚动时快速清理大部分旧点，只保留最近几个点
        if (points.length > 3) {
            // 只保留最后3个点，避免拖尾卡在旧位置
            const recentPoints = points.slice(-3);
            points.length = 0;
            points.push(...recentPoints);
            
            // 更新路径
            if (points.length >= 2) {
                updatePath();
            } else {
                clearTrail();
            }
        }
        
        // 如果滚动事件包含鼠标位置信息，继续更新
        if (e && e.clientX !== undefined && e.clientY !== undefined) {
            updateTrail(e.clientX, e.clientY);
        }
        
        // 滚动结束后恢复
        scrollTimeout = setTimeout(() => {
            isScrolling = false;
        }, 100);
    };
    
    // 监听滚动事件（包括wheel和scroll）
    window.addEventListener('wheel', handleScroll, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // 监听触摸滚动（移动端）
    let touchStartY = 0;
    document.addEventListener('touchstart', (e) => {
        touchStartY = e.touches[0].clientY;
    }, { passive: true });
    
    document.addEventListener('touchmove', (e) => {
        const touchY = e.touches[0].clientY;
        if (Math.abs(touchY - touchStartY) > 10) {
            clearTrail();
        }
    }, { passive: true });
    
    // 窗口大小改变时重新初始化
    window.addEventListener('resize', () => {
        clearTrail();
    });
    
    // 页面可见性改变时清空拖尾
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            clearTrail();
        }
    });
    
    // 鼠标离开窗口时清空拖尾
    document.addEventListener('mouseleave', () => {
        clearTrail();
    });
})();

