import {
    handleCardClick,
    showProjectDetails,
    hideProjectDetails,
    filterCards,
    playSound
} from './cardModule.js';

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
        gallery.addEventListener('wheel', handleScroll, { passive: false });
        document.addEventListener('mousemove', handleMouseMove);
        
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
    visibleCards.forEach((card, index) => {
        const offset = index - window.currentIndex;
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
        card.style.zIndex = Math.abs(offset) === 0 ? 1000 : (totalVisible - Math.abs(offset));
        if (Math.abs(offset) === 0) {
            card.classList.add('active');
        } else {
            card.classList.remove('active');
        }
    });
}

function handleScroll(event) {
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

gallery.addEventListener('wheel', handleScroll, {
    passive: false
});
closeDetails.addEventListener('click', hideProjectDetails);

// 初始化卡片位置
updateCardPositions();

// 添加鼠标移动事件处理
function handleMouseMove(e) {
    const visibleCards = Array.from(cards).filter(card => card.style.display !== 'none');
    const totalVisible = visibleCards.length;
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
            scale(${Math.abs(offset) === 0 ? 1.2 : 0.8})
        `;
        card.style.transform = transform;
        card.style.transition = 'transform 0.1s ease-out';
    });
}

// 初始添加鼠标移动事件监听
document.addEventListener('mousemove', handleMouseMove);

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
});

document.addEventListener('DOMContentLoaded', () => {
    const lazyImages = document.querySelectorAll('.lazy');
    lazyImages.forEach(img => {
        img.src = img.dataset.src;
    });
});

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

    // 分类按钮
    categoryButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            currentCategory = button.dataset.category;
            filterCardsByCategoryAndYear();
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
        });
    });

    // All按钮
    if (allBtn) {
        allBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            yearButtons.forEach(btn => btn.classList.remove('active'));
            currentCategory = 'all';
            currentYear = 'all';
            filterCardsByCategoryAndYear();
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    bindFilterEvents();
    // 其他初始化...
});

window.updateCardPositions = updateCardPositions;
window.currentIndex = currentIndex;

// 重新绑定所有卡片的事件
function bindCardEvents() {
    cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        card.removeEventListener('click', handleCardClick);
        card.removeEventListener('mouseenter', handleCardHover);
        card.removeEventListener('mouseleave', handleCardLeave);
        card.removeEventListener('mousemove', handleMouseMove);
        card.addEventListener('click', handleCardClick);
        card.addEventListener('mouseenter', handleCardHover);
        card.addEventListener('mouseleave', handleCardLeave);
        card.addEventListener('mousemove', handleMouseMove);
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

      card.innerHTML = `
        <img src="${project.image}" alt="${project.title}">
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
      const url = 'resume.png';
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
      window.location.reload();
    });
  }
});