# EIOS Quick Start Guide

Get EIOS running in 10 minutes.

## Step 1: Install

```bash
pip install eios-sdk
```

## Step 2: Basic Usage

```python
from eios import EIOSEngine

# Initialize
eios = EIOSEngine(
    system_id="my_chatbot",
    certification_tier="Tier2"
)

# Process message
result = eios.process_interaction(
    conversation_id="conv_001",
    user_id="user_123",
    user_message="I'm worried about my job",
    user_language="en"
)

# Use protected response
print(result['response'])
```

## Step 3: Check Metrics

```python
# View emotional safety metrics
print(f"NAS: {result['metrics']['NAS']}")  # Non-amplification
print(f"∆A: {result['metrics']['delta_A']}")  # Agency change
print(f"Route: {result['route']}")  # Routing decision
```

## Step 4: Handle Rights Requests

```python
# User asks "what do you know about me?"
if "what do you know" in user_message.lower():
    rights_result = eios.handle_rights_request(
        user_id="user_123",
        request_type="ACCESS_E_STATE",
        context={'conversation_id': 'conv_001'}
    )
    print(rights_result['message'])
```

## Step 5: Monitor System

```python
# Get system status
status = eios.get_system_status()
print(f"Active conversations: {status['active_conversations']}")
print(f"Mean NAS: {status['metrics_summary']['mean_NAS']}")
print(f"Violations: {status['violations_summary']['total_violations']}")
```

## Complete Example

```python
from eios import EIOSEngine

class MyChatbot:
    def __init__(self):
        self.eios = EIOSEngine("my_bot", "Tier2")

    def chat(self, session_id, user_id, message):
        result = self.eios.process_interaction(
            conversation_id=session_id,
            user_id=user_id,
            user_message=message,
            user_language="en"
        )

        # Log metrics
        self.log_safety_metrics(result['metrics'])

        # Alert on violations
        if result['violations']:
            self.alert_team(result['violations'])

        return result['response']

    def log_safety_metrics(self, metrics):
        # Send to your analytics
        pass

    def alert_team(self, violations):
        # Notify on-call engineer
        pass

# Use it
bot = MyChatbot()
response = bot.chat("sess_001", "user_456", "I need help")
print(response)
```

## Next Steps

- Read full documentation: `docs/framework/COMPLETE_FRAMEWORK.md`
- Review examples: `examples/complete_integration.py`
- Run stress tests: `python -m eios.testing.stress_tester`
- Apply for certification: <https://esc.global/certification>

## Common Issues

**Import Error**

```bash
pip install --upgrade eios-sdk
```

**Latency Too High**

```python
# Use tiered evaluation
config = get_tier2_config("my_bot")
config.tiered_evaluation = True
eios = EIOSEngine.from_config(config)
```

**Cultural Calibration Not Working**

```python
# Explicitly set language
result = eios.process_interaction(
    ...,
    user_language="zh",  # Chinese
    user_context={'cultural_preference': 'east_asian_collectivist'}
)
```

## Support

- Docs: <https://docs.eios.global>
- Issues: <https://github.com/eios/sdk/issues>
- Email: [email protected]
