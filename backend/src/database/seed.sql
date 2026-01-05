-- Seed data for Home Automation

-- Default rooms
INSERT OR IGNORE INTO rooms (id, name, icon, sort_order) VALUES
    ('living_room', 'Living Room', 'sofa', 1),
    ('bedroom', 'Bedroom', 'bed', 2),
    ('kitchen', 'Kitchen', 'utensils', 3);

-- Sample devices
INSERT OR IGNORE INTO devices (id, room_id, name, type, control_type, gpio_pin, mqtt_topic_base, state) VALUES
    ('living_room_light1', 'living_room', 'Main Light', 'light', 'relay', 18, 'home/living_room/light1', '{"on": false}'),
    ('living_room_light2', 'living_room', 'Accent Light', 'light', 'relay', 19, 'home/living_room/light2', '{"on": false}'),
    ('living_room_fan', 'living_room', 'Ceiling Fan', 'fan', 'relay', 21, 'home/living_room/fan', '{"on": false, "speed": 0}'),
    ('living_room_tv', 'living_room', 'TV', 'tv', 'ir', NULL, 'home/living_room/tv', '{"on": false}'),
    ('living_room_ac', 'living_room', 'Air Conditioner', 'ac', 'ir', NULL, 'home/living_room/ac', '{"on": false, "temp": 24, "mode": "cool"}'),

    ('bedroom_light1', 'bedroom', 'Main Light', 'light', 'relay', 18, 'home/bedroom/light1', '{"on": false}'),
    ('bedroom_light2', 'bedroom', 'Bedside Lamp', 'light', 'relay', 19, 'home/bedroom/light2', '{"on": false}'),
    ('bedroom_fan', 'bedroom', 'Ceiling Fan', 'fan', 'pwm', 21, 'home/bedroom/fan', '{"on": false, "speed": 0}'),
    ('bedroom_ac', 'bedroom', 'Air Conditioner', 'ac', 'ir', NULL, 'home/bedroom/ac', '{"on": false, "temp": 24, "mode": "cool"}'),

    ('kitchen_light1', 'kitchen', 'Main Light', 'light', 'relay', 18, 'home/kitchen/light1', '{"on": false}'),
    ('kitchen_light2', 'kitchen', 'Counter Light', 'light', 'relay', 19, 'home/kitchen/light2', '{"on": false}'),
    ('kitchen_fridge', 'kitchen', 'Refrigerator', 'appliance', 'sensor', NULL, 'home/kitchen/fridge', '{"on": true}'),
    ('kitchen_washer', 'kitchen', 'Washing Machine', 'appliance', 'relay', 25, 'home/kitchen/washer', '{"on": false}');

-- Sample scenes
INSERT OR IGNORE INTO scenes (id, name, icon, actions) VALUES
    ('movie_night', 'Movie Night', 'film', '[{"device_id": "living_room_light1", "action": {"on": false}}, {"device_id": "living_room_light2", "action": {"on": true, "brightness": 20}}, {"device_id": "living_room_tv", "action": {"on": true}}]'),
    ('good_morning', 'Good Morning', 'sun', '[{"device_id": "bedroom_light1", "action": {"on": true}}, {"device_id": "bedroom_ac", "action": {"on": false}}, {"device_id": "kitchen_light1", "action": {"on": true}}]'),
    ('good_night', 'Good Night', 'moon', '[{"device_id": "living_room_light1", "action": {"on": false}}, {"device_id": "living_room_light2", "action": {"on": false}}, {"device_id": "bedroom_ac", "action": {"on": true, "temp": 25}}, {"device_id": "living_room_tv", "action": {"on": false}}]'),
    ('all_off', 'All Off', 'power', '[{"device_id": "*", "action": {"on": false}}]');

-- Sample schedules
INSERT OR IGNORE INTO schedules (device_id, name, cron_expression, action, enabled) VALUES
    ('living_room_light1', 'Evening lights on', '0 18 * * *', '{"on": true}', 1),
    ('living_room_light1', 'Night lights off', '0 23 * * *', '{"on": false}', 1),
    ('bedroom_ac', 'Night AC on', '0 22 * * *', '{"on": true, "temp": 25, "mode": "cool"}', 0);

-- Common IR codes (examples - actual codes vary by brand)
INSERT OR IGNORE INTO ir_codes (brand, device_type, command, protocol, code) VALUES
    ('Generic', 'ac', 'power', 'NEC', '0x10AF8877'),
    ('Generic', 'ac', 'temp_up', 'NEC', '0x10AF48B7'),
    ('Generic', 'ac', 'temp_down', 'NEC', '0x10AFC837'),
    ('Generic', 'ac', 'mode_cool', 'NEC', '0x10AF906F'),
    ('Generic', 'ac', 'mode_fan', 'NEC', '0x10AFE01F'),
    ('Generic', 'tv', 'power', 'NEC', '0x20DF10EF'),
    ('Generic', 'tv', 'volume_up', 'NEC', '0x20DF40BF'),
    ('Generic', 'tv', 'volume_down', 'NEC', '0x20DFC03F'),
    ('Generic', 'tv', 'mute', 'NEC', '0x20DF906F');
