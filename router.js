// 简单的路由系统
let currentRoute = 'home';
let projectsData = null;

// 初始化路由
export function initRouter() {
    // 检查是否是单轨叙事模式
    const homePage = document.getElementById('home-page');
    const isSingleTrack = homePage && homePage.classList.contains('single-track-container');
    
    if (isSingleTrack) {
        // 单轨叙事模式：确保主页可见，不处理路由
        console.log('Single track mode detected, skipping router initialization');
        // 确保主页可见
        if (homePage) {
            homePage.style.display = 'block';
        }
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

// 渲染项目导航列表
function renderProjectNav(currentProjectId) {
    if (!projectsData) return;
    
    const navContainer = document.getElementById('project-nav');
    if (!navContainer) return;
    
    // 清空现有内容
    navContainer.innerHTML = '';
    
    // 按日期排序（最新的在前）
    const sortedProjects = [...projectsData.projects].sort((a, b) => {
        const dateA = a.date ? new Date(a.date) : new Date(0);
        const dateB = b.date ? new Date(b.date) : new Date(0);
        return dateB - dateA;
    });
    
    // 创建导航项
    sortedProjects.forEach(project => {
        const navItem = document.createElement('a');
        navItem.className = 'project-nav-item';
        navItem.href = `#/project/${project.id}`;
        navItem.textContent = project.title;
        
        // 高亮当前项目
        if (project.id === currentProjectId) {
            navItem.classList.add('active');
        }
        
        // 点击事件
        navItem.addEventListener('click', (e) => {
            e.preventDefault();
            navigateToProject(project.id);
            // 平滑滚动到顶部
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        
        navContainer.appendChild(navItem);
    });
}

// 显示项目详情页
export function showProjectPage(projectId) {
    if (!projectsData) {
        console.error('Projects data not loaded yet');
        return;
    }

    const project = projectsData.projects.find(p => p.id === projectId);
    if (!project) {
        console.error('Project not found:', projectId);
        showHomePage();
        return;
    }

    currentRoute = 'project';
    const homePage = document.getElementById('home-page');
    const projectPage = document.getElementById('project-page');
    const topNavbar = document.querySelector('.top-navbar');
    
    if (homePage) homePage.style.display = 'none';
    if (projectPage) projectPage.style.display = 'flex';
    // 隐藏顶部导航栏
    if (topNavbar) topNavbar.style.display = 'none';
    // 去掉body的顶部padding
    document.body.style.paddingTop = '0';

    // 渲染项目列表导航
    renderProjectNav(projectId);
    
    // 渲染项目详情
    renderProjectPage(project);
    
    // 生成目录
    generateTOC();
    
    // 绑定左上角名字点击事件
    bindSidebarNameClick();
    
    // 滚动到顶部
    window.scrollTo(0, 0);
}

// 导航到项目页面
export function navigateToProject(projectId) {
    window.location.hash = `#/project/${projectId}`;
    showProjectPage(projectId);
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

    // 更新图片
    const imgEl = document.getElementById('project-image-full');
    if (imgEl && project.image) {
        imgEl.src = project.image;
        imgEl.alt = project.title;
        imgEl.style.display = 'block';
        // 确保图片容器可见
        const imgContainer = imgEl.closest('.project-image-container');
        if (imgContainer) {
            imgContainer.style.display = 'block';
        }
    } else if (imgEl) {
        // 如果没有图片，隐藏容器
        imgEl.style.display = 'none';
        const imgContainer = imgEl.closest('.project-image-container');
        if (imgContainer) {
            imgContainer.style.display = 'none';
        }
    }

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

    // 更新图片画廊
    const galleryContainer = document.querySelector('#project-page .project-gallery-full');
    if (galleryContainer) {
        // 清除旧内容
        galleryContainer.innerHTML = '';
        
        // 移除旧的标题和分割线
        const oldGalleryTitle = document.getElementById('gallery-title-full');
        if (oldGalleryTitle) oldGalleryTitle.remove();
        const oldGalleryDivider = document.getElementById('gallery-divider-full');
        if (oldGalleryDivider) oldGalleryDivider.remove();
        const oldSettingTitle = document.querySelector('#setting-gallery-full')?.previousElementSibling;
        if (oldSettingTitle && oldSettingTitle.textContent && oldSettingTitle.textContent.includes('Setting Gallery')) {
            const prevHr = oldSettingTitle.previousElementSibling;
            if (prevHr && prevHr.tagName === 'HR') prevHr.remove();
            oldSettingTitle.remove();
        }
        const oldSettingGallery = document.getElementById('setting-gallery-full');
        if (oldSettingGallery) oldSettingGallery.remove();
        
        if (project.gallery && project.gallery.length > 0) {
            // 在画廊容器前插入标题（如果需要）
            const existingTitle = document.getElementById('gallery-title-full');
            if (!existingTitle) {
                galleryContainer.insertAdjacentHTML('beforebegin', `<div id='gallery-title-full' style='font-weight:600;font-size:0.9rem;margin-bottom:20px;color:#666;text-transform:uppercase;letter-spacing:1px;'>Photos</div>`);
            }
            
            project.gallery.forEach((img, index) => {
                const imgEl = document.createElement('img');
                imgEl.src = img;
                imgEl.alt = `${project.title} - Photo ${index + 1}`;
                imgEl.loading = 'lazy';
                imgEl.style.cursor = 'pointer';
                imgEl.style.display = 'block';
                imgEl.onclick = () => {
                    if (window.openLightbox) {
                        const allImgs = Array.from(galleryContainer.querySelectorAll('img'));
                        const idx = allImgs.indexOf(imgEl);
                        window.openLightbox(allImgs, idx);
                    }
                };
                galleryContainer.appendChild(imgEl);
            });
            // 确保画廊容器显示
            galleryContainer.style.display = 'grid';
        } else {
            // 如果没有图片，隐藏画廊容器
            galleryContainer.style.display = 'none';
        }

        // Setting Gallery
        if (project.settingGallery && project.settingGallery.length > 0) {
            const settingContainer = document.getElementById('setting-gallery-container-full');
            if (settingContainer) {
                settingContainer.innerHTML = '';
                settingContainer.style.cssText = 'display:grid;grid-template-columns:repeat(2,1fr);gap:20px;margin:0 0 60px 0;width:100%;';
                
                project.settingGallery.forEach((img, index) => {
                    const imgEl = document.createElement('img');
                    imgEl.src = img;
                    imgEl.alt = `Setting Gallery - Photo ${index + 1}`;
                    imgEl.loading = 'lazy';
                    imgEl.style.cssText = 'width:100%;height:450px;object-fit:cover;display:block;transition:transform 0.3s,filter 0.3s;cursor:pointer;background:#f5f5f5;';
                    imgEl.onclick = () => {
                        if (window.openLightbox) {
                            const allImgs = Array.from(settingContainer.querySelectorAll('img'));
                            const idx = allImgs.indexOf(imgEl);
                            window.openLightbox(allImgs, idx);
                        }
                    };
                    settingContainer.appendChild(imgEl);
                });
            }
        } else {
            const settingContainer = document.getElementById('setting-gallery-container-full');
            if (settingContainer) {
                settingContainer.innerHTML = '';
            }
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

