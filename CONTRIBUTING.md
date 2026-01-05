# Contributing to MQTT Fan Speed Monitor

Thank you for your interest in contributing to this project!

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/yourusername/mqtt-fan-speed-monitor/issues)
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (OS, Node.js version, etc.)

### Suggesting Features

1. Open an issue with the `enhancement` label
2. Describe the feature and its use case
3. Discuss implementation approaches if possible

### Pull Requests

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes
4. Test thoroughly
5. Commit with clear messages: `git commit -m 'Add: your feature description'`
6. Push to your fork: `git push origin feature/your-feature`
7. Open a Pull Request

## Development Setup

```bash
# Clone your fork
git clone https://github.com/yourusername/mqtt-fan-speed-monitor.git
cd mqtt-fan-speed-monitor

# Start MQTT broker
docker compose up -d

# Backend
cd backend && npm install && npm run dev

# Frontend (new terminal)
cd frontend && npm install && npm run dev
```

## Code Style

- Use ES6+ JavaScript features
- Follow existing code patterns
- Add comments for complex logic
- Keep components small and focused

## Commit Message Format

```
Type: Short description

Longer description if needed.
```

Types: `Add`, `Fix`, `Update`, `Remove`, `Refactor`, `Docs`

## Questions?

Open an issue with the `question` label.
