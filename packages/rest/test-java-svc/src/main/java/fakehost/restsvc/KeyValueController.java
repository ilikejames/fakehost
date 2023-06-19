package fakehost.restsvc;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import fakehost.restsvc.entities.*;

import java.util.Map;

@RestController
@RequestMapping("/store")
public class KeyValueController {

    @Autowired
    private KeyValueService keyValueService;

    @GetMapping("/")
    public Map<String, String> getAll() {
        return keyValueService.getAll();
    }

    @GetMapping("/{key}")
    public ResponseEntity<String> getValue(@PathVariable String key) {
        return keyValueService.getValue(key)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{key}")
    public ResponseEntity<Void> createValue(@PathVariable String key, @RequestBody ValueWrapper value) {
        return keyValueService.createValue(key, value.getValue()) ?
                ResponseEntity.ok().build() :
                ResponseEntity.status(409).build();
    }

    @PatchMapping("/{key}")
    public ResponseEntity<Void> updateValue(@PathVariable String key, @RequestBody ValueWrapper value) {
        return keyValueService.updateValue(key, value.getValue()) ?
                ResponseEntity.ok().build() :
                ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{key}")
    public ResponseEntity<Void> deleteValue(@PathVariable String key) {
        return keyValueService.deleteValue(key) ?
                ResponseEntity.ok().build() :
                ResponseEntity.notFound().build();
    }
}
