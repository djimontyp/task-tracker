# Технічне завдання: Universal Issue Detection & Processing System

## 🎯 **Мета проекту**

Створити AI-powered систему автоматичного виявлення та класифікації проблем з Telegram чатів команд з автоматичним створенням задач у task tracker'ах (Linear/Redmine). Система повинна працювати в режимі реального часу, забезпечувати надійність обробки та легко масштабуватися.

**Business Case:** Автоматизація процесу виявлення та тріажу проблем економить 2+ години щодня для команди розробників, гарантує що жодна критична проблема не залишиться без уваги.

---

## 📋 **Функціональні вимоги**

### **Core Features:**
1. **Real-time Message Processing**
   - Читання повідомлень з Telegram чатів через polling
   - Exactly-once processing guarantee через NATS JetStream
   - Automatic recovery після перезапусків системи
   - Batch processing для historical messages

2. **AI-Powered Classification**
   - Автоматична класифікація повідомлень (bug/feature/question/info)
   - Priority assessment (low/medium/high/critical)
   - Confidence scoring для кожної класифікації
   - Entity extraction (проекти, технології, дедлайни)

3. **Duplicate Detection**
   - Multi-level duplicate detection (exact/fuzzy/semantic)
   - Similarity threshold configuration
   - Time-windowed blocking (24-hour windows)
   - Performance optimization через Redis caching

4. **Task Tracker Integration**
   - Linear GraphQL API integration (primary)
   - Redmine REST API support (fallback)
   - Automatic project/team mapping
   - Bulk operations для high-volume scenarios

5. **Monitoring & Observability**
   - Real-time CLI dashboard з статистикою
   - Structured logging через Loguru
   - Performance metrics tracking
   - Error alerting та health checks

6. **Reliability Features**
   - Circuit breaker patterns для external APIs
   - Exponential backoff з jitter
   - Dead letter queue для failed messages
   - Transactional outbox pattern

---

## 🏗️ **Системна архітектура**

### **High-Level Architecture**
```
┌─────────────────────────────────────────────────────────────┐
│                    SYSTEM ARCHITECTURE                     │
├─────────────────────────────────────────────────────────────┤
│  [Telegram API] ──polling──> [Message Ingestion]           │
│        │                           │                       │
│        ▼                           ▼                       │
│  [NATS JetStream] ──queue──> [TaskIQ Workers]             │
│        │                           │                       │
│        ▼                           ▼                       │
│  [AI Classification] ──results──> [Issue Detection]        │
│        │                           │                       │
│        ▼                           ▼                       │
│  [Duplicate Check] ──unique──> [Task Creation]            │
│        │                           │                       │
│        ▼                           ▼                       │
│  [PostgreSQL] <──sync──> [Linear/Redmine APIs]            │
│        │                           │                       │
│        ▼                           ▼                       │
│  [Rich CLI Dashboard] <──monitor──> [Metrics & Logs]       │
└─────────────────────────────────────────────────────────────┘
```

### **Technology Stack**

#### **Core Infrastructure**
- **Application Framework:** FastAPI з async/await
- **Task Queue:** TaskIQ з NATS JetStream broker
- **Database:** PostgreSQL 15 з async SQLAlchemy/SQLModel
- **Caching:** Redis для embeddings та similarity results
- **Containerization:** Docker з multi-stage builds

#### **AI & Processing**
- **Primary LLM:** Local Ollama models (qwen3:14b, mistral-nemo)
- **Fallback LLM:** GPT-4o-mini для складних випадків  
- **LLM Integration:** pydantic-ai для structured outputs
- **Similarity Detection:** Sentence Transformers (all-MiniLM-L6-v2)
- **Text Processing:** spaCy для entity extraction

#### **External Integrations**
- **Telegram:** python-telegram-bot з polling mode
- **Linear:** GraphQL API з official schema
- **Redmine:** REST API з custom fields support
- **Monitoring:** Langfuse для LLM observability

#### **Development & Operations**
- **CLI Interface:** Rich для beautiful terminal output
- **Configuration:** Pydantic Settings з .env support
- **Logging:** Loguru з structured JSON output
- **Testing:** pytest з async support
- **Code Quality:** Ruff для linting та formatting

---

## 📊 **Модель даних**

### **Simplified Schema (3 Tables)**

#### **Messages Table**
- Зберігає всі оброблені повідомлення з Telegram
- JSONB поле для metadata та flexible schema
- Підтримка різних джерел (не тільки Telegram)
- Idempotency через unique external_id

#### **Issues Table** 
- Результати AI класифікації
- Confidence scores та priority levels
- Foreign key до Messages
- Support для entity extraction results

#### **TaskExports Table**
- Tracking створених задач у external systems
- Status tracking (pending/created/failed)
- External task IDs та URLs
- Retry metadata для failed exports

### **Key Design Principles**
- **JSONB для гнучкості:** Easy schema evolution без migrations
- **Minimal normalization:** Faster queries, easier maintenance
- **Audit trail:** Повна історія всіх операцій
- **Multi-source ready:** Підготовлено для Slack, Discord expansion

---

## ⚡ **Performance Requirements**

### **Throughput Targets**
- **Message Processing:** 2000+ повідомлень на день
- **Classification Speed:** <5 секунд per message
- **Task Creation:** <10 секунд end-to-end
- **Concurrent Users:** 10+ team members simultaneously

### **Reliability Targets**
- **System Uptime:** 99.5% availability
- **Message Loss:** 0% (exactly-once processing)
- **Error Recovery:** <1 minute automatic recovery
- **Data Consistency:** ACID transactions для critical operations

### **Scalability Targets**
- **Horizontal Scaling:** 5+ worker instances
- **Team Growth:** 100+ team members support
- **Message Volume:** 10x growth capacity
- **Multi-region:** Ready для geographic distribution

---

## 🔧 **Integration Specifications**

### **Telegram Integration**
- **Authentication:** Bot token з BotFather
- **Message Types:** Text messages, replies, forwards
- **Rate Limiting:** 30 messages/second compliance
- **Error Handling:** Automatic retry з exponential backoff
- **Data Privacy:** Message content anonymization options

### **Linear Integration**
- **API Type:** GraphQL з strongly typed schema
- **Authentication:** API key або OAuth2
- **Rate Limits:** 1,500 requests/hour для API keys
- **Features:** Real-time webhooks, bulk operations
- **Data Mapping:** Automatic project/team assignment

### **Redmine Integration**
- **API Type:** REST API з JSON responses
- **Authentication:** API key або username/password
- **Custom Fields:** Support для arbitrary metadata
- **Attachment Handling:** Two-step upload process
- **Bulk Operations:** Multiple issue creation

---

## 🛡️ **Security & Compliance**

### **Data Protection**
- **Input Sanitization:** HTML escaping, SQL injection prevention
- **PII Detection:** Automatic email/phone/IP masking
- **Audit Logging:** Complete access trail
- **Data Retention:** Configurable message retention periods

### **API Security**
- **Rate Limiting:** Per-user та global limits
- **Input Validation:** Pydantic models для all inputs
- **Error Handling:** No sensitive data в error messages
- **Secret Management:** Environment variables, no hardcoded keys

### **Network Security**
- **HTTPS Everywhere:** All external API calls
- **Webhook Validation:** HMAC signature verification
- **IP Whitelisting:** Optional restriction для admin access
- **Container Security:** Non-root users, minimal attack surface

---

## 📈 **Monitoring & Metrics**

### **Business Metrics**
- **Messages Processed:** Daily/weekly volumes
- **Issues Detected:** Classification accuracy tracking
- **Tasks Created:** Success rates і response times
- **Time Savings:** Manual vs automated processing comparison

### **Technical Metrics**
- **System Performance:** Response times, throughput, error rates
- **Resource Usage:** CPU, memory, disk, network utilization
- **Queue Health:** Depth, processing lag, worker status
- **External APIs:** Success rates, rate limit usage

### **AI/ML Metrics**
- **Classification Accuracy:** Precision, recall, F1 scores
- **Model Performance:** Inference time, token usage
- **Confidence Distribution:** Score histograms і trends
- **Duplicate Detection:** False positive/negative rates

---

## 🚀 **Deployment Strategy**

### **Development Environment**
- **Local Setup:** Docker Compose з all services
- **Database:** PostgreSQL container з volume persistence
- **Message Broker:** NATS container з JetStream enabled
- **AI Models:** Local Ollama instance

### **Production Environment**
- **Orchestration:** Kubernetes з HELM charts
- **High Availability:** Multi-replica deployments
- **Load Balancing:** NGINX ingress controller
- **Monitoring:** Prometheus + Grafana stack
- **Logging:** ELK stack або Loki

### **CI/CD Pipeline**
- **Testing:** Automated test suite з coverage reports
- **Building:** Multi-stage Docker builds
- **Deployment:** GitOps з ArgoCD або Flux
- **Rollback:** Blue-green deployments

---

## 💰 **Cost Optimization**

### **LLM Cost Management**
- **Local Models First:** Ollama для majority of processing
- **Smart Fallbacks:** Cloud LLMs тільки для complex cases
- **Caching Strategy:** Semantic similarity для duplicate queries
- **Batch Processing:** Group similar requests

### **Infrastructure Costs**
- **Resource Right-sizing:** CPU/memory optimization
- **Auto-scaling:** Scale down during low usage
- **Efficient Storage:** Compression та archival policies
- **Network Optimization:** CDN for static assets

---

## 🎯 **Success Criteria**

### **MVP Success (Sprint Goal)**
- ✅ Processes 50+ real Telegram messages
- ✅ Achieves 80%+ classification accuracy
- ✅ Creates verified tasks у Linear або JSON
- ✅ Runs stable demo for 10+ minutes
- ✅ Demonstrates clear ROI potential

### **Production Ready (Month 1)**
- ✅ Handles 2000+ messages daily
- ✅ Maintains 99.5% uptime
- ✅ <2% duplicate task creation
- ✅ Full monitoring та alerting
- ✅ Documentation та runbooks complete

### **Scale Ready (Month 3)**
- ✅ Multi-team support
- ✅ Advanced analytics dashboard
- ✅ Custom classification rules
- ✅ Enterprise security features
- ✅ Multi-channel source support

---

## 🚨 **Risk Assessment**

### **Technical Risks**
- **LLM Performance:** Local models may be slower than cloud alternatives
- **API Rate Limits:** External services may throttle requests
- **Data Volume:** Message storage growth over time
- **Model Accuracy:** AI classification may need fine-tuning

### **Business Risks**
- **User Adoption:** Teams may resist automation
- **Privacy Concerns:** Message content sensitivity
- **Integration Complexity:** Task tracker API changes
- **Maintenance Overhead:** System complexity growth

### **Mitigation Strategies**
- **Performance:** Benchmarking та optimization plans
- **Rate Limits:** Circuit breakers та backoff strategies
- **Storage:** Data retention policies та archival
- **Accuracy:** Human feedback loops та model retraining
- **Adoption:** Training та gradual rollout
- **Privacy:** Anonymization та consent mechanisms

---

## 📚 **Documentation Requirements**

### **Technical Documentation**
- **Architecture Overview:** High-level system design
- **API Documentation:** All endpoints та schemas
- **Deployment Guide:** Step-by-step setup instructions
- **Configuration Reference:** All settings та environment variables

### **User Documentation**
- **Quick Start Guide:** 15-minute setup tutorial
- **CLI Reference:** All commands та options
- **Troubleshooting:** Common issues та solutions
- **Best Practices:** Recommended usage patterns

### **Operational Documentation**
- **Runbooks:** Incident response procedures
- **Monitoring Guide:** Alerts та dashboards setup
- **Backup Procedures:** Data protection strategies
- **Scaling Guide:** Capacity planning recommendations

---

## 🔄 **Future Roadmap**

### **Phase 1: Core Platform (Months 1-2)**
- Basic message processing pipeline
- Single team support
- Linear integration
- CLI interface

### **Phase 2: Intelligence (Months 3-4)**
- Advanced duplicate detection
- Custom classification rules
- Multi-channel support
- Web dashboard

### **Phase 3: Enterprise (Months 5-6)**
- Multi-team isolation
- Advanced analytics
- Enterprise security
- API marketplace integration

### **Phase 4: AI Evolution (Months 7-12)**
- Custom model fine-tuning
- Predictive analytics
- Automated workflow creation
- Integration marketplace