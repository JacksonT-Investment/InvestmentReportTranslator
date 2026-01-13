// 研报解读助手 - 主要JavaScript文件

class ReportAnalyzer {
    constructor() {
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('fileInput');
        this.uploadProgress = document.getElementById('uploadProgress');
        this.progressBar = document.getElementById('progressBar');
        this.demoBtn = document.getElementById('demoBtn');
        
        this.init();
    }

    init() {
        this.setupFileUpload();
        this.setupDemoButton();
        this.setupAnimations();
    }

    // 文件上传功能设置
    setupFileUpload() {
        // 点击上传区域
        this.uploadArea.addEventListener('click', () => {
            this.fileInput.click();
        });

        // 文件选择
        this.fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.handleFileUpload(file);
            }
        });

        // 拖拽功能
        this.uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.uploadArea.classList.add('dragover');
        });

        this.uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            this.uploadArea.classList.remove('dragover');
        });

        this.uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.uploadArea.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                const file = files[0];
                if (this.validateFile(file)) {
                    this.handleFileUpload(file);
                }
            }
        });
    }

    // 验证文件格式
    validateFile(file) {
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/jpeg',
            'image/png',
            'image/jpg'
        ];

        const maxSize = 50 * 1024 * 1024; // 50MB

        if (!allowedTypes.includes(file.type)) {
            this.showNotification('不支持的文件格式，请上传PDF、Word文档或图片文件', 'error');
            return false;
        }

        if (file.size > maxSize) {
            this.showNotification('文件大小不能超过50MB', 'error');
            return false;
        }

        return true;
    }

    // 处理文件上传
    async handleFileUpload(file) {
        // 显示文件名和大小
        this.showFileInfo(file);
        
        // 显示上传进度
        this.showProgress();
        
        try {
            // 创建FormData对象
            const formData = new FormData();
            formData.append('report', file);
            
            // 调用后端API
            const response = await fetch('http://localhost:3001/api/analyze', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error('分析失败');
            }
            
            const result = await response.json();
            
            if (result.success) {
                // 将结果存储到sessionStorage，供结果页面使用
                sessionStorage.setItem('analysisResult', JSON.stringify(result));
                sessionStorage.setItem('filename', file.name);
                
                // 跳转到结果页面
                window.location.href = 'result.html';
            } else {
                throw new Error(result.error || '分析失败');
            }
            
        } catch (error) {
            console.error('上传失败:', error);
            this.showNotification('分析失败: ' + error.message, 'error');
            
            // 重置上传界面
            this.resetUploadArea();
        }
    }

    // 显示文件信息
    showFileInfo(file) {
        const fileName = file.name;
        const fileSize = this.formatFileSize(file.size);
        
        this.uploadArea.innerHTML = `
            <div class="text-center">
                <div class="mb-4">
                    <svg class="w-16 h-16 mx-auto text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                </div>
                <h3 class="text-white text-lg font-semibold mb-2">${fileName}</h3>
                <p class="text-white/70 text-sm">文件大小: ${fileSize}</p>
            </div>
        `;
    }

    // 格式化文件大小
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // 显示上传进度
    showProgress() {
        this.uploadProgress.classList.remove('hidden');
        
        // 动画进度条
        anime({
            targets: this.progressBar,
            width: '100%',
            duration: 3000,
            easing: 'easeInOutQuad',
            complete: () => {
                this.uploadProgress.querySelector('p').textContent = '分析完成，正在生成解读...';
            }
        });
    }

    // 模拟处理过程
    simulateProcessing(file) {
        return new Promise((resolve) => {
            const steps = [
                '正在识别文档内容...',
                '正在提取关键信息...',
                '正在生成通俗解读...',
                '正在提炼重点数据...',
                '正在格式化结果...'
            ];

            let currentStep = 0;
            const progressText = this.uploadProgress.querySelector('p');

            const interval = setInterval(() => {
                if (currentStep < steps.length) {
                    progressText.textContent = steps[currentStep];
                    currentStep++;
                } else {
                    clearInterval(interval);
                    resolve();
                }
            }, 600);
        });
    }

    // 设置示例按钮
    setupDemoButton() {
        this.demoBtn.addEventListener('click', (e) => {
            e.preventDefault();
            
            // 显示加载动画
            this.showDemoLoading();
            
            // 2秒后跳转到示例页面
            setTimeout(() => {
                window.location.href = 'result.html';
            }, 2000);
        });
    }

    // 显示示例加载动画
    showDemoLoading() {
        const button = this.demoBtn;
        const originalText = button.textContent;
        
        button.textContent = '正在加载示例...';
        button.disabled = true;
        
        // 添加加载动画
        anime({
            targets: button,
            scale: [1, 0.95, 1],
            duration: 1000,
            easing: 'easeInOutQuad',
            loop: true
        });
        
        setTimeout(() => {
            button.textContent = originalText;
            button.disabled = false;
            anime.remove(button);
        }, 2000);
    }

    // 设置动画效果
    setupAnimations() {
        // 页面加载动画
        anime({
            targets: '.hero-title',
            translateY: [50, 0],
            opacity: [0, 1],
            duration: 1000,
            easing: 'easeOutQuart',
            delay: 300
        });

        anime({
            targets: '.glass-card',
            translateY: [30, 0],
            opacity: [0, 1],
            duration: 800,
            easing: 'easeOutQuart',
            delay: 600
        });

        // 统计数据动画
        this.animateStats();

        // 粒子动画
        this.animateParticles();

        // 滚动视差效果
        this.setupParallax();
    }

    // 统计数据动画
    animateStats() {
        const statsNumbers = document.querySelectorAll('.stats-number');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const target = entry.target;
                    const finalValue = target.textContent;
                    
                    // 数字动画
                    if (finalValue.includes('%')) {
                        this.animateNumber(target, 0, 95, '%');
                    } else if (finalValue.includes('万+')) {
                        this.animateNumber(target, 0, 10, '万+');
                    } else if (finalValue.includes('分钟')) {
                        this.animateNumber(target, 0, 3, '分钟');
                    }
                    
                    observer.unobserve(target);
                }
            });
        });

        statsNumbers.forEach(stat => observer.observe(stat));
    }

    // 数字动画
    animateNumber(element, start, end, suffix = '') {
        anime({
            targets: { value: start },
            value: end,
            duration: 2000,
            easing: 'easeOutQuart',
            update: function(anim) {
                const value = Math.round(anim.animatables[0].target.value);
                element.textContent = value + suffix;
            }
        });
    }

    // 粒子动画
    animateParticles() {
        const particles = document.querySelectorAll('.particle');
        
        particles.forEach((particle, index) => {
            // 随机大小和位置
            const size = Math.random() * 6 + 2;
            particle.style.width = size + 'px';
            particle.style.height = size + 'px';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.top = Math.random() * 100 + '%';
            
            // 随机动画延迟
            particle.style.animationDelay = Math.random() * 6 + 's';
            particle.style.animationDuration = (Math.random() * 4 + 4) + 's';
        });
    }

    // 滚动视差效果
    setupParallax() {
        let ticking = false;

        const updateParallax = () => {
            const scrolled = window.pageYOffset;
            const parallaxElements = document.querySelectorAll('.particle');
            
            parallaxElements.forEach((element, index) => {
                const speed = 0.5 + (index % 3) * 0.2;
                const yPos = -(scrolled * speed);
                element.style.transform = `translateY(${yPos}px)`;
            });

            ticking = false;
        };

        const requestParallaxUpdate = () => {
            if (!ticking) {
                requestAnimationFrame(updateParallax);
                ticking = true;
            }
        };

        window.addEventListener('scroll', requestParallaxUpdate);
    }

    // 显示通知
    showNotification(message, type = 'info') {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = `fixed top-20 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transform translate-x-full transition-transform duration-300`;
        
        // 根据类型设置样式
        if (type === 'error') {
            notification.classList.add('bg-red-500', 'text-white');
        } else if (type === 'success') {
            notification.classList.add('bg-green-500', 'text-white');
        } else {
            notification.classList.add('bg-blue-500', 'text-white');
        }
        
        notification.innerHTML = `
            <div class="flex items-center justify-between">
                <span class="text-sm">${message}</span>
                <button class="ml-4 text-white hover:text-gray-200" onclick="this.parentElement.parentElement.remove()">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // 显示动画
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 100);
        
        // 自动隐藏
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        }, 5000);
    }
}

// 工具函数
const Utils = {
    // 防抖函数
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // 节流函数
    throttle(func, limit) {
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
    },

    // 检查元素是否在视口中
    isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    },

    // 平滑滚动到元素
    scrollToElement(element, offset = 0) {
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;

        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    new ReportAnalyzer();
});

// 导出全局函数供其他脚本使用
window.ReportUtils = Utils;