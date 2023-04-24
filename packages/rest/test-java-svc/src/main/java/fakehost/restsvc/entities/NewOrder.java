package fakehost.restsvc.entities;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Data
public class NewOrder {
    @Getter
    @Setter
    String symbol;
    @Getter
    @Setter
    private int quantity;
    @Getter
    @Setter
    private OrderSide side;
}
