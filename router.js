// 简单的路由系统
let currentRoute = 'home';
let projectsData = null;

// 允许外部设置项目数据（用于单轨叙事模式）
if (typeof window !== 'undefined') {
    window.setProjectsData = function(data) {
        projectsData = data;
        console.log('Projects data set from external source:', data.projects.length, 'projects');
    };
}

// 初始化路由
export function initRouter() {
    // 检查是否是单轨叙事模式
    const homePage = document.getElementById('home-page');
    const isSingleTrack = homePage && homePage.classList.contains('single-track-container');
    
    if (isSingleTrack) {
        // 单轨叙事模式：确保主页可见，但也要加载数据用于项目详情页
        console.log('Single track mode detected, loading data for project pages');
        // 确保主页可见
        if (homePage) {
            homePage.style.display = 'block';
        }
        
        // 仍然需要加载项目数据，用于项目详情页
        fetch('data.json')
            .then(res => res.json())
            .then(data => {
                projectsData = data;
                // 检查URL中的路由（延迟一点确保DOM已加载）
                setTimeout(() => {
                    handleRoute();
                }, 100);
            })
            .catch(err => console.error('Failed to load projects data:', err));
        
        // 监听URL变化
        window.addEventListener('hashchange', handleRoute);
        return;
    }
    
    // 加载项目数据
    fetch('data.json')
        .then(res => res.json())
        .then(data => {
            projectsData = data;
            // 检查URL中的路由（延迟一点确保DOM已加载）
            setTimeout(() => {
                handleRoute();
            }, 100);
        })
        .catch(err => console.error('Failed to load projects data:', err));

    // 监听URL变化
    window.addEventListener('hashchange', handleRoute);
    // popstate事件在hash路由中不太需要，但保留以防万一
    window.addEventListener('popstate', () => {
        setTimeout(handleRoute, 50);
    });
}

// 处理路由
function handleRoute() {
    const hash = window.location.hash;
    
    if (hash.startsWith('#/project/')) {
        const projectId = parseInt(hash.replace('#/project/', ''));
        if (projectId && projectsData) {
            showProjectPage(projectId);
        } else {
            showHomePage();
        }
    } else {
        showHomePage();
    }
}

// 显示主页
export function showHomePage() {
    currentRoute = 'home';
    const homePage = document.getElementById('home-page');
    const projectPage = document.getElementById('project-page');
    const topNavbar = document.querySelector('.top-navbar');
    
    if (homePage) {
        homePage.style.display = 'block';
        // 单轨叙事模式
        if (homePage.classList.contains('single-track-container')) {
            document.body.classList.add('single-track-mode');
            if (topNavbar) topNavbar.style.display = 'none';
            document.body.style.paddingTop = '0';
            document.body.style.overflow = 'hidden';
        }
    }
    if (projectPage) projectPage.style.display = 'none';
    
    // 更新URL（不刷新页面）
    if (window.location.hash !== '') {
        history.pushState(null, '', window.location.pathname);
    }
}

// 渲染项目导航列表（项目详情页不再需要左侧导航，改为顶部导航）
function renderProjectNav(currentProjectId) {
    // 项目详情页使用顶部导航栏，不需要左侧导航
    // 保留此函数以防其他地方调用
}

// 显示项目详情页
export function showProjectPage(projectId) {
    console.log('showProjectPage called with projectId:', projectId);
    console.log('projectsData:', projectsData);
    
    // 如果数据还没加载，先加载
    if (!projectsData) {
        console.log('Projects data not loaded, fetching...');
        fetch('data.json')
            .then(res => res.json())
            .then(data => {
                projectsData = data;
                console.log('Projects data loaded, showing project page');
                showProjectPage(projectId);
            })
            .catch(err => {
                console.error('Failed to load projects data:', err);
            });
        return;
    }

    const project = projectsData.projects.find(p => p.id === projectId);
    if (!project) {
        console.error('Project not found:', projectId);
        showHomePage();
        return;
    }

    console.log('Found project:', project.title);

    currentRoute = 'project';
    const homePage = document.getElementById('home-page');
    const projectPage = document.getElementById('project-page');
    const projectsGridView = document.getElementById('projects-grid-view');
    const archivesGridView = document.getElementById('archives-grid-view');
    const topNavbar = document.querySelector('.top-navbar');
    const singleTrackNav = document.getElementById('single-track-nav');
    
    // 隐藏其他页面
    if (homePage) {
        homePage.style.display = 'none';
        console.log('Home page hidden');
    }
    if (projectsGridView) {
        projectsGridView.style.display = 'none';
    }
    if (archivesGridView) {
        archivesGridView.style.display = 'none';
    }
    
    // 显示项目详情页 - 使用强制样式确保显示
    if (projectPage) {
        console.log('Setting project page styles...');
        projectPage.style.display = 'block';
        projectPage.style.visibility = 'visible';
        projectPage.style.opacity = '1';
        projectPage.style.position = 'fixed';
        projectPage.style.top = '0';
        projectPage.style.left = '0';
        projectPage.style.width = '100vw';
        projectPage.style.height = '100vh';
        projectPage.style.zIndex = '10004';
        projectPage.style.overflowY = 'auto';
        projectPage.style.overflowX = 'hidden';
        projectPage.style.background = '#000';
        projectPage.style.paddingTop = '80px';
        projectPage.style.boxSizing = 'border-box';
        console.log('Project page displayed');
    } else {
        console.error('Project page element not found!');
        return;
    }
    
    // 隐藏顶部导航栏，显示项目详情页导航栏
    if (topNavbar) topNavbar.style.display = 'none';
    if (singleTrackNav) singleTrackNav.style.display = 'none';
    
    // 去掉body的顶部padding，设置黑色背景
    document.body.style.paddingTop = '0';
    document.body.style.overflow = 'auto';
    document.body.style.background = '#000';

    // 渲染项目详情
    renderProjectPage(project);
    
    // 绑定导航栏点击事件
    bindProjectDetailNav();
    
    // 滚动到顶部
    setTimeout(() => {
        window.scrollTo(0, 0);
        if (projectPage) {
            projectPage.scrollTo(0, 0);
        }
    }, 100);
}

// 绑定项目详情页导航栏事件
function bindProjectDetailNav() {
    // PROJECTS链接
    const projectsLink = document.getElementById('project-detail-projects-link');
    if (projectsLink) {
        // 移除旧的事件监听器（如果有）
        const newProjectsLink = projectsLink.cloneNode(true);
        projectsLink.parentNode.replaceChild(newProjectsLink, projectsLink);
        
        newProjectsLink.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('PROJECTS link clicked');
            if (window.showProjectsGridView) {
                console.log('Calling showProjectsGridView');
                window.showProjectsGridView();
            } else {
                console.error('showProjectsGridView not found on window');
                showHomePage();
            }
        });
    } else {
        console.error('PROJECTS link not found!');
    }
    
    // RESUME链接
    const resumeLink = document.getElementById('project-detail-resume-link');
    if (resumeLink) {
        resumeLink.addEventListener('click', (e) => {
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
    
    // ARCHIVES链接
    const archivesLink = document.getElementById('project-detail-archives-link');
    if (archivesLink) {
        // 移除旧的事件监听器（如果有）
        const newArchivesLink = archivesLink.cloneNode(true);
        archivesLink.parentNode.replaceChild(newArchivesLink, archivesLink);
        
        newArchivesLink.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('ARCHIVES link clicked');
            if (window.showArchivesGridView) {
                console.log('Calling showArchivesGridView');
                window.showArchivesGridView();
            } else {
                console.error('showArchivesGridView not found on window');
                showHomePage();
            }
        });
    } else {
        console.error('ARCHIVES link not found!');
    }
    
    // 名字链接 - 回到首页
    const nameLink = document.getElementById('project-detail-home-link');
    if (nameLink) {
        nameLink.addEventListener('click', (e) => {
            e.preventDefault();
            showHomePage();
        });
    }
}

// 导航到项目页面
export function navigateToProject(projectId) {
    console.log('=== navigateToProject called with projectId:', projectId);
    
    // 如果数据还没加载，先加载
    if (!projectsData) {
        console.log('Projects data not loaded, fetching...');
        fetch('data.json')
            .then(res => res.json())
            .then(data => {
                projectsData = data;
                console.log('Projects data loaded, showing project page');
                showProjectPage(projectId);
            })
            .catch(err => {
                console.error('Failed to load projects data:', err);
            });
        return;
    }
    
    console.log('Calling showProjectPage directly...');
    // 直接显示项目页面，不依赖hash
    showProjectPage(projectId);
    
    // 更新URL（但不阻塞）
    window.location.hash = `#/project/${projectId}`;
}

// 渲染项目详情页面
function renderProjectPage(project) {
    // 更新标题
    const titleEl = document.getElementById('project-title-full');
    if (titleEl) titleEl.textContent = project.title;

    // 更新分类和标签（在新布局中显示在meta信息中）
    const categoryEl = document.getElementById('project-category-full');
    const categoryMeta = document.getElementById('project-category-meta');
    if (categoryEl && categoryMeta) {
        const category = Array.isArray(project.category) 
            ? project.category.join(', ') 
            : project.category;
        categoryEl.textContent = category;
        if (category) {
            categoryMeta.style.display = 'flex';
        }
    }

    const tagsEl = document.getElementById('project-tags-full');
    const tagsMeta = document.getElementById('project-tags-meta');
    if (tagsEl && tagsMeta) {
        const tags = Array.isArray(project.tags) 
            ? project.tags.join(', ') 
            : (project.tags || '');
        tagsEl.textContent = tags;
        if (tags) {
            tagsMeta.style.display = 'flex';
        }
    }

    // 主图不再单独显示，直接显示在画廊中

    // 更新描述
    const descEl = document.getElementById('project-description-section');
    if (descEl) {
        descEl.innerHTML = project.description || '';
    }

    // 更新技术栈和日期
    const techEl = document.getElementById('project-tech-full');
    if (techEl) techEl.textContent = project.tech || 'N/A';

    const dateEl = document.getElementById('project-date-full');
    if (dateEl) dateEl.textContent = project.date || 'N/A';

    // 更新详情列表（添加Role和Team信息）
    const detailsList = document.getElementById('project-details-list-full');
    if (detailsList) {
        detailsList.innerHTML = '';
        
        // 添加Role信息
        if (project.role) {
            const roleItem = document.createElement('div');
            roleItem.className = 'meta-item';
            roleItem.innerHTML = `
                <span class="meta-label">Role</span>
                <span class="meta-value">${project.role}</span>
            `;
            detailsList.appendChild(roleItem);
        }

        // 添加Team信息
        if (project.team) {
            const teamItem = document.createElement('div');
            teamItem.className = 'meta-item';
            let teamText = `${project.team.role}`;
            if (project.team.size) {
                teamText += ` • ${project.team.size}`;
            }
            if (project.team.members) {
                teamText += ` • ${project.team.members}`;
            }
            teamItem.innerHTML = `
                <span class="meta-label">Team</span>
                <span class="meta-value">${teamText}</span>
            `;
            detailsList.appendChild(teamItem);
        }
    }

    // 更新视频/演示
    const videoSlot = document.getElementById('project-video-slot-full');
    if (videoSlot) {
        videoSlot.innerHTML = '';
        videoSlot.style.display = 'block';
        videoSlot.style.marginBottom = '60px';
        videoSlot.id = 'project-video-section'; // 确保有ID用于目录跳转
        
        // P5.js作品（优先显示）
        if (project.demoLink && project.demoLink.includes('editor.p5js.org') && project.demoLink.includes('/full/')) {
            videoSlot.innerHTML = `<div style='width:100%;display:flex;justify-content:center;overflow-x:auto;margin-bottom:60px;'><iframe src="${project.demoLink}" width="100%" height="600" frameborder="0" allowfullscreen style="border-radius:0;max-width:100%;min-width:320px;display:block;margin:auto;"></iframe></div>`;
        }
        // Bilibili视频
        else if (project.videoLink && project.videoLink.includes('bilibili.com')) {
            // Bilibili视频需要提取BV号
            const bvMatch = project.videoLink.match(/BV[\w]+/);
            if (bvMatch) {
                const bvId = bvMatch[0];
                videoSlot.innerHTML = `<div style="width:100%;display:flex;justify-content:center;margin-bottom:60px;"><iframe src="https://player.bilibili.com/player.html?bvid=${bvId}&page=1" width="100%" height="600" scrolling="no" frameborder="0" allowfullscreen="allowfullscreen" style="border-radius:0;max-width:100%;display:block;margin:auto;"></iframe></div>`;
            }
        }
        // Vimeo视频
        else if (project.videoLink && project.videoLink.includes('vimeo.com')) {
            const match = project.videoLink.match(/vimeo\.com\/(\d+)/);
            const vimeoId = match ? match[1] : null;
            if (vimeoId) {
                videoSlot.innerHTML = `<div style="width:100%;display:flex;justify-content:center;margin-bottom:60px;"><iframe src="https://player.vimeo.com/video/${vimeoId}" width="100%" height="600" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" style="border-radius:0;max-width:100%;display:block;margin:auto;"></iframe></div>`;
            }
        }
        // YouTube视频
        else if (project.videoLink && (project.videoLink.includes('youtube.com') || project.videoLink.includes('youtu.be'))) {
            let youtubeId = '';
            if (project.videoLink.includes('youtube.com')) {
                const url = new URL(project.videoLink);
                youtubeId = url.searchParams.get('v');
            } else {
                const match = project.videoLink.match(/youtu\.be\/([\w-]+)/);
                youtubeId = match ? match[1] : '';
            }
            if (youtubeId) {
                videoSlot.innerHTML = `<div style="width:100%;display:flex;justify-content:center;margin-bottom:60px;"><iframe width="100%" height="600" src="https://www.youtube.com/embed/${youtubeId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" style="border-radius:0;max-width:100%;display:block;margin:auto;"></iframe></div>`;
            }
        } else {
            // 如果没有视频，隐藏视频槽
            videoSlot.style.display = 'none';
        }
    } else {
        console.error('Video slot not found!');
    }

    // 更新图片画廊（包括主图和所有照片）
    const galleryContainer = document.querySelector('#project-page .project-detail-gallery');
    if (galleryContainer) {
        // 清除旧内容
        galleryContainer.innerHTML = '';
        
        // 收集所有图片（主图 + 画廊图片 + Setting Gallery）
        const allImages = [];
        if (project.image) {
            allImages.push({ src: project.image, alt: project.title });
        }
        if (project.gallery && project.gallery.length > 0) {
            project.gallery.forEach(img => {
                allImages.push({ src: img, alt: `${project.title} - Gallery` });
            });
        }
        if (project.settingGallery && project.settingGallery.length > 0) {
            project.settingGallery.forEach(img => {
                allImages.push({ src: img, alt: `${project.title} - Setting Gallery` });
            });
        }
        
        if (allImages.length > 0) {
            allImages.forEach((imgData, index) => {
                const imgEl = document.createElement('img');
                imgEl.src = imgData.src;
                imgEl.alt = imgData.alt;
                imgEl.loading = 'lazy';
                imgEl.style.cssText = 'width:100%;height:auto;max-height:900px;object-fit:contain;display:block;margin-bottom:40px;cursor:pointer;background:#000;';
                imgEl.onclick = () => {
                    if (window.openLightbox) {
                        const allImgElements = Array.from(galleryContainer.querySelectorAll('img'));
                        window.openLightbox(allImgElements, index);
                    }
                };
                galleryContainer.appendChild(imgEl);
            });
            galleryContainer.style.display = 'block';
        } else {
            galleryContainer.style.display = 'none';
        }
    } else {
        console.error('Gallery container not found!');
    }

    // 更新功能列表
    const featuresContainer = document.querySelector('.project-features-full');
    if (featuresContainer) {
        if (project.features && project.features.length > 0) {
            featuresContainer.innerHTML = `
                <h3>Key Features</h3>
                <ul>
                    ${project.features.map(feature => `<li>${feature}</li>`).join('')}
                </ul>
            `;
            featuresContainer.style.display = 'block';
        } else {
            featuresContainer.style.display = 'none';
        }
    }

    // 更新链接按钮
    const projectLink = document.getElementById('project-link-full');
    if (projectLink) {
        projectLink.innerHTML = '';
        
        // Bilibili视频
        if (project.videoLink && project.videoLink.includes('bilibili.com')) {
            const biliBtn = document.createElement('a');
            biliBtn.href = project.videoLink.trim();
            biliBtn.target = '_blank';
            biliBtn.className = 'project-link-btn video-link';
            biliBtn.style.cssText = 'background: #ff2233; color: #fff; font-weight: 600; letter-spacing: 1px;';
            biliBtn.textContent = 'Watch Video';
            projectLink.appendChild(biliBtn);
        }
        
        // 演示链接
        if (project.demoLink) {
            const demoLink = document.createElement('a');
            demoLink.href = project.demoLink;
            demoLink.target = '_blank';
            demoLink.className = 'project-link-btn demo-link';
            demoLink.textContent = 'Visit Website';
            projectLink.appendChild(demoLink);
        }
        
        // Google Drive链接
        if (project.link) {
            const driveLink = document.createElement('a');
            driveLink.href = project.link;
            driveLink.target = '_blank';
            driveLink.className = 'project-link-btn drive-link';
            driveLink.textContent = 'View Document';
            projectLink.appendChild(driveLink);
        }
        
        projectLink.style.display = (project.videoLink || project.demoLink || project.link) ? 'flex' : 'none';
    }
    
    // 渲染"You may also like"部分
    renderYouMayAlsoLike(project.id);
}

// 渲染"You may also like"部分
function renderYouMayAlsoLike(currentProjectId) {
    if (!projectsData) return;
    
    const carousel = document.getElementById('you-may-also-like-carousel');
    if (!carousel) return;
    
    // 获取除当前项目外的其他项目
    const otherProjects = projectsData.projects.filter(p => p.id !== currentProjectId);
    
    // 随机排序，显示所有项目（这样可以有多个4个一组的页面）
    const relatedProjects = otherProjects.sort(() => Math.random() - 0.5);
    
    carousel.innerHTML = '';
    
    relatedProjects.forEach(relatedProject => {
        const item = document.createElement('div');
        item.className = 'you-may-also-like-item';
        item.dataset.projectId = relatedProject.id;
        
        item.innerHTML = `
            <img src="${relatedProject.image}" alt="${relatedProject.title}" loading="lazy">
            <div class="you-may-also-like-overlay">
                <h3 class="you-may-also-like-item-title">${relatedProject.title}</h3>
            </div>
        `;
        
        // 点击跳转到项目详情页
        item.addEventListener('click', () => {
            if (window.navigateToProject) {
                window.navigateToProject(relatedProject.id);
            }
        });
        
        carousel.appendChild(item);
    });
    
    // 初始化轮播导航
    initYouMayAlsoLikeCarousel();
}

// 初始化轮播导航
function initYouMayAlsoLikeCarousel() {
    const carousel = document.getElementById('you-may-also-like-carousel');
    const prevBtn = document.getElementById('you-may-also-like-prev');
    const nextBtn = document.getElementById('you-may-also-like-next');
    
    if (!carousel || !prevBtn || !nextBtn) return;
    
    // 计算每个项目的宽度（包括gap）
    const getItemWidth = () => {
        const items = carousel.querySelectorAll('.you-may-also-like-item');
        if (items.length === 0) return 0;
        const firstItem = items[0];
        const itemWidth = firstItem.offsetWidth;
        const gap = 20; // 与CSS中的gap一致
        return itemWidth + gap;
    };
    
    // 每次滑动3个项目
    const scrollAmount = () => getItemWidth() * 3;
    
    // 左箭头 - 向左滑动3个
    prevBtn.addEventListener('click', () => {
        const currentScroll = carousel.scrollLeft;
        const amount = scrollAmount();
        const newScroll = Math.max(0, currentScroll - amount);
        
        carousel.scrollTo({
            left: newScroll,
            behavior: 'smooth'
        });
    });
    
    // 右箭头 - 向右滑动3个
    nextBtn.addEventListener('click', () => {
        const currentScroll = carousel.scrollLeft;
        const amount = scrollAmount();
        const maxScroll = carousel.scrollWidth - carousel.clientWidth;
        const newScroll = Math.min(maxScroll, currentScroll + amount);
        
        carousel.scrollTo({
            left: newScroll,
            behavior: 'smooth'
        });
    });
    
    // 更新箭头状态
    const updateNavButtons = () => {
        const currentScroll = carousel.scrollLeft;
        const maxScroll = carousel.scrollWidth - carousel.clientWidth;
        const threshold = 10; // 容差
        
        if (currentScroll <= threshold) {
            prevBtn.classList.add('disabled');
        } else {
            prevBtn.classList.remove('disabled');
        }
        
        if (currentScroll >= maxScroll - threshold) {
            nextBtn.classList.add('disabled');
        } else {
            nextBtn.classList.remove('disabled');
        }
    };
    
    carousel.addEventListener('scroll', updateNavButtons);
    
    // 窗口大小改变时重新计算
    window.addEventListener('resize', () => {
        setTimeout(updateNavButtons, 100);
    });
    
    // 初始更新
    setTimeout(updateNavButtons, 100);
}

// 获取项目ID（从卡片元素）
export function getProjectIdFromCard(card) {
    // 尝试从卡片的data属性获取
    if (card.dataset.projectId) {
        return parseInt(card.dataset.projectId);
    }
    
    // 尝试从标题匹配
    const title = card.querySelector('h3')?.textContent.trim();
    if (title && projectsData) {
        const project = projectsData.projects.find(p => p.title.trim() === title);
        return project ? project.id : null;
    }
    
    return null;
}

// 生成目录
function generateTOC() {
    const tocNav = document.getElementById('project-toc-nav');
    if (!tocNav) return;
    
    tocNav.innerHTML = '';
    
    // 定义目录项（按页面顺序）
    const tocItems = [
        { id: 'project-hero-section', label: 'Image', level: 1 },
        { id: 'project-title-section', label: 'Title', level: 1 },
        { id: 'project-description-section', label: 'Description', level: 1 },
        { id: 'project-meta-section', label: 'Details', level: 1 },
        { id: 'project-video-section', label: 'Video', level: 1 },
        { id: 'project-gallery-section', label: 'Gallery', level: 1 }
    ];
    
    tocItems.forEach(item => {
        const section = document.getElementById(item.id);
        // 检查section是否存在且有内容（视频section需要检查是否有iframe）
        const hasContent = section && (
            section.innerHTML.trim() !== '' || 
            item.id === 'project-title-section' ||
            (item.id === 'project-video-section' && section.querySelector('iframe'))
        );
        
        if (hasContent) {
            const tocItem = document.createElement('a');
            tocItem.className = `toc-item level-${item.level}`;
            tocItem.href = `#${item.id}`;
            tocItem.textContent = item.label;
            tocItem.onclick = (e) => {
                e.preventDefault();
                scrollToSection(item.id);
            };
            tocNav.appendChild(tocItem);
        }
    });
}

// 滚动到指定区域
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        const offset = 20;
        const elementPosition = section.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;
        
        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
        
        // 更新活动目录项
        updateActiveTOCItem(sectionId);
    }
}

// 更新活动目录项
function updateActiveTOCItem(activeId) {
    const tocItems = document.querySelectorAll('.toc-item');
    tocItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('href') === `#${activeId}`) {
            item.classList.add('active');
        }
    });
}

// 监听滚动，自动更新活动目录项
let scrollTimeout;
window.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
        const sections = [
            'project-hero-section',
            'project-title-section',
            'project-description-section',
            'project-meta-section',
            'project-video-section',
            'project-gallery-section'
        ];
        
        let currentSection = '';
        sections.forEach(sectionId => {
            const section = document.getElementById(sectionId);
            if (section) {
                const rect = section.getBoundingClientRect();
                if (rect.top <= 100 && rect.bottom >= 100) {
                    currentSection = sectionId;
                }
            }
        });
        
        if (currentSection) {
            updateActiveTOCItem(currentSection);
        }
    }, 100);
});

// 绑定左上角名字点击事件
function bindSidebarNameClick() {
    const sidebarName = document.getElementById('sidebar-home-link');
    if (sidebarName) {
        sidebarName.onclick = () => {
            if (window.showHomePage) {
                window.showHomePage();
            } else {
                window.location.hash = '';
                window.location.reload();
            }
        };
    }
}

