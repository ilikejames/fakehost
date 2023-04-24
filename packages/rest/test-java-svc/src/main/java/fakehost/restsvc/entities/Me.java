package fakehost.restsvc.entities;

import lombok.Data;

@Data
public class Me {
    String username;

    public Me(String username) {
        this.username = username;
    }
}
