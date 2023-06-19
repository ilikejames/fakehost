package fakehost.restsvc;

import fakehost.restsvc.entities.*;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
public class KeyValueService {

    private final Map<String, String> store = new HashMap<>();

    public Map<String, String> getAll() {
        return store;
    }

    public Optional<String> getValue(String key) {
        return Optional.ofNullable(store.get(key));
    }

    public boolean createValue(String key, String value) {
        if (store.containsKey(key)) {
            return false;
        }
        store.put(key, value);
        return true;
    }

    public boolean updateValue(String key, String value) {
        if (!store.containsKey(key)) {
            return false;
        }
        store.put(key, value);
        return true;
    }

    public boolean deleteValue(String key) {
        return store.remove(key) != null;
    }
}
