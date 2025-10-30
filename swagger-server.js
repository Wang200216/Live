const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

const app = express();
const port = 3001; // 使用不同端口避免冲突

// 中间件
app.use(cors());
app.use(express.json());

// 加载Swagger文档（合并 & 拆分）
const swaggerAll = YAML.load(path.join(__dirname, 'swagger-homepage.yaml'));
const swaggerPublic = YAML.load(path.join(__dirname, 'swagger-public.yaml'));
const swaggerAdmin = YAML.load(path.join(__dirname, 'swagger-admin.yaml'));

// Swagger UI 路由
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerAll, { swaggerOptions: { docExpansion: 'list', deepLinking: true } }));
app.use('/api-docs/public', swaggerUi.serveFiles(swaggerPublic), swaggerUi.setup(swaggerPublic, { swaggerOptions: { docExpansion: 'list', deepLinking: true } }));
app.use('/api-docs/admin', swaggerUi.serveFiles(swaggerAdmin), swaggerUi.setup(swaggerAdmin, { swaggerOptions: { docExpansion: 'list', deepLinking: true } }));

// Mock数据
let mockVotes = {
    leftVotes: 1250,
    rightVotes: 1180
};

let mockAIContent = [
    {
        id: 1,
        text: "正方观点：痛苦是人生成长的必要经历，消除痛苦会让我们失去学习和成长的机会。",
        side: "left",
        timestamp: Date.now() - 300000,
        likes: 45,
        comments: [
            {
                user: "心理学家",
                text: "痛苦确实能促进心理成长，但过度的痛苦也可能造成创伤",
                time: "3分钟前",
                avatar: "🧠",
                likes: 15
            },
            {
                user: "哲学家",
                text: "尼采说过，那些杀不死我们的，会让我们更强大",
                time: "4分钟前",
                avatar: "🤔",
                likes: 23
            }
        ]
    },
    {
        id: 2,
        text: "反方观点：如果能够消除痛苦，为什么不呢？痛苦本身没有价值，消除痛苦可以让人更专注于积极的事情。",
        side: "right",
        timestamp: Date.now() - 240000,
        likes: 52,
        comments: [
            {
                user: "医生",
                text: "作为医生，我见过太多不必要的痛苦，如果能消除，我支持",
                time: "2分钟前",
                avatar: "👨‍⚕️",
                likes: 18
            },
            {
                user: "患者家属",
                text: "看着亲人痛苦，我多么希望有这样的按钮",
                time: "3分钟前",
                avatar: "💝",
                likes: 31
            }
        ]
    }
];

const mockDebateTopic = {
    title: "如果有一个能一键消除痛苦的按钮，你会按吗？",
    description: "这是一个关于痛苦、成长与人性选择的深度辩论"
};

// Mock API路由 - 完全按照Swagger规范实现

// 缓存机制
let votesCache = null;
let votesCacheTime = 0;
const CACHE_DURATION = 2000; // 2秒缓存

// 获取票数统计（带缓存）
app.get('/api/votes', (req, res) => {
    const now = Date.now();
    
    // 如果缓存有效，直接返回缓存数据
    if (votesCache && (now - votesCacheTime) < CACHE_DURATION) {
        return res.json(votesCache);
    }
    
    // 计算票数统计
    const totalVotes = mockVotes.leftVotes + mockVotes.rightVotes;
    const leftPercentage = totalVotes > 0 ? Math.round((mockVotes.leftVotes / totalVotes) * 100) : 50;
    const rightPercentage = totalVotes > 0 ? Math.round((mockVotes.rightVotes / totalVotes) * 100) : 50;
    
    const response = {
        success: true,
        data: {
            leftVotes: mockVotes.leftVotes,
            rightVotes: mockVotes.rightVotes,
            totalVotes: totalVotes,
            leftPercentage: leftPercentage,
            rightPercentage: rightPercentage
        }
    };
    
    // 更新缓存
    votesCache = response;
    votesCacheTime = now;
    
    res.json(response);
});

// 用户投票（优化版本）
app.post('/api/user-vote', (req, res) => {
    const { side, votes = 10 } = req.body;
    
    // 参数验证
    if (!side || !['left', 'right'].includes(side)) {
        return res.status(400).json({
            success: false,
            message: "投票方参数错误，必须是left或right"
        });
    }
    
    // 限制单次投票数量
    const validVotes = Math.min(Math.max(votes, 1), 100);
    
    // 更新票数
    if (side === 'left') {
        mockVotes.leftVotes += validVotes;
    } else {
        mockVotes.rightVotes += validVotes;
    }
    
    // 清除缓存，确保下次获取最新数据
    votesCache = null;
    
    // 计算百分比
    const totalVotes = mockVotes.leftVotes + mockVotes.rightVotes;
    const leftPercentage = Math.round((mockVotes.leftVotes / totalVotes) * 100);
    const rightPercentage = Math.round((mockVotes.rightVotes / totalVotes) * 100);
    
    // 立即返回响应，不阻塞
    res.json({
        success: true,
        data: {
            leftVotes: mockVotes.leftVotes,
            rightVotes: mockVotes.rightVotes,
            leftPercentage: leftPercentage,
            rightPercentage: rightPercentage
        }
    });
});

// 获取AI内容
app.get('/api/ai-content', (req, res) => {
    res.json({
        success: true,
        data: mockAIContent
    });
});

// 添加评论
app.post('/api/comment', (req, res) => {
    const { contentId, user = "匿名用户", text, avatar = "👤" } = req.body;
    
    if (!contentId || !text) {
        return res.status(400).json({
            success: false,
            message: "缺少必要参数：contentId和text"
        });
    }
    
    const content = mockAIContent.find(item => item.id === contentId);
    if (!content) {
        return res.status(404).json({
            success: false,
            message: "内容不存在"
        });
    }
    
    const newComment = {
        user: user,
        text: text,
        time: "刚刚",
        avatar: avatar,
        likes: 0
    };
    
    content.comments.push(newComment);
    
    res.json({
        success: true,
        data: newComment
    });
});

// 点赞功能
app.post('/api/like', (req, res) => {
    const { contentId, commentId } = req.body;
    
    if (!contentId) {
        return res.status(400).json({
            success: false,
            message: "缺少必要参数：contentId"
        });
    }
    
    const content = mockAIContent.find(item => item.id === contentId);
    if (!content) {
        return res.status(404).json({
            success: false,
            message: "内容不存在"
        });
    }
    
    if (commentId !== undefined) {
        // 评论点赞
        const comment = content.comments.find(c => c.id === commentId);
        if (!comment) {
            return res.status(404).json({
                success: false,
                message: "评论不存在"
            });
        }
        comment.likes += 1;
        res.json({
            success: true,
            data: { likes: comment.likes }
        });
    } else {
        // 内容点赞
        content.likes += 1;
        res.json({
            success: true,
            data: { likes: content.likes }
        });
    }
});

// 获取辩题信息
app.get('/api/debate-topic', (req, res) => {
    res.json({
        success: true,
        data: mockDebateTopic
    });
});

// 模拟实时数据更新
function simulateRealTimeUpdates() {
    setInterval(() => {
        // 模拟票数变化
        const leftIncrease = Math.floor(Math.random() * 3) + 1;
        const rightIncrease = Math.floor(Math.random() * 3) + 1;
        mockVotes.leftVotes += leftIncrease;
        mockVotes.rightVotes += rightIncrease;
        
        console.log(`[Mock Server] 票数更新: 正方 ${mockVotes.leftVotes}, 反方 ${mockVotes.rightVotes}`);
    }, 5000); // 每5秒更新一次
    
    // 模拟新AI内容
    setInterval(() => {
        const newContents = [
            {
                text: "正方补充：痛苦让我们珍惜快乐，没有对比就没有真正的幸福。",
                side: "left"
            },
            {
                text: "反方补充：现代医学已经在消除很多痛苦，这个按钮只是技术的延伸。",
                side: "right"
            }
        ];
        
        const randomContent = newContents[Math.floor(Math.random() * newContents.length)];
        const newContent = {
            id: mockAIContent.length + 1,
            text: randomContent.text,
            side: randomContent.side,
            timestamp: Date.now(),
            likes: Math.floor(Math.random() * 20) + 10,
            comments: []
        };
        
        mockAIContent.push(newContent);
        console.log(`[Mock Server] 新增AI内容: ${newContent.text}`);
    }, 20000); // 每20秒添加新内容
}

// 启动服务器
app.listen(port, () => {
    console.log(`🚀 Swagger Mock服务器运行在 http://localhost:${port}`);
    console.log(`📚 API文档地址: http://localhost:${port}/api-docs`);
    console.log(`🎯 辩题: ${mockDebateTopic.title}`);
    
    // 启动模拟数据更新
    simulateRealTimeUpdates();
});

module.exports = app;
