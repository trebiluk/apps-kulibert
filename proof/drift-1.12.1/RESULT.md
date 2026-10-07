# Drift 1.12.1

Builder accept on a fresh page (shared bar on), real pointer input, no element.click / dispatchEvent.

## Check

```
OK 915x412 Clouds Space Reef Start >=44px fully on screen below the shared bar
OK 412x915 Clouds Space Reef Start >=44px fully on screen below the shared bar
OK 1366x768 Clouds Space Reef Start >=44px fully on screen below the shared bar
OK 915x412 tap Space (aria-checked, sky=space) -> Start -> drag steers (yaw moved) -> Boost pressed
OK rotate mid-play 412x915 -> 915x412 -> 412x915 keeps Space running
OK 0 console errors
OK publish with 8791 busy still writes the Drift door (auto free port)
OK DRIFT_PORT=8800 binds 8800 and the fetched HTML is the Drift door
```

What's new: Drift: Space is easy to pick on a sideways phone.
