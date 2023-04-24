package fakehost.restsvc;

import fakehost.restsvc.entities.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.google.gson.Gson;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;


@RestController
@RequestMapping("/orders")
public class OrderController {

    private static final Gson gson = new Gson();
    private static final AtomicInteger idCounter = new AtomicInteger(1);
    private static final String[] allowedSymbols = new String[]{"AAPL", "TSLA", "GME"};

    @Operation(summary = "Place an order", description = "Places an order with the given symbol, quantity, and side")
    @ApiResponse(responseCode = "201", description = "Order placed successfully", content = @Content(mediaType = "application/json", schema = @Schema(implementation =  Order.class)))
    @ApiResponse(responseCode = "400", description = "Invalid input")
    @PostMapping(path = "/", consumes = {"application/x-www-form-urlencoded", "application/json"})
    public ResponseEntity<Map<String, Object>> placeOrder(@ModelAttribute @RequestBody NewOrder order) {

        String symbol = order.getSymbol();
        int quantity = order.getQuantity();
        OrderSide side = order.getSide();

        if (!isValidSymbol(symbol)) {
            var error = new ErrorResponse("Unknown symbol");
            return new ResponseEntity(gson.toJson(error), HttpStatus.BAD_REQUEST);
        }

        if (quantity <= 0) {
            var error = new ErrorResponse("Quantity should be greater than zero");
            return new ResponseEntity(gson.toJson(error), HttpStatus.BAD_REQUEST);
        }

        var createdOrder = new Order();
        createdOrder.setId(idCounter.getAndIncrement());
        createdOrder.setQuantity(quantity);
        createdOrder.setSide(side);
        createdOrder.setSymbol(symbol);

        return new ResponseEntity(gson.toJson(createdOrder), HttpStatus.CREATED);
    }

    private boolean isValidSymbol(String symbol) {
        for (String allowedSymbol : allowedSymbols) {
            if (allowedSymbol.equalsIgnoreCase(symbol)) {
                return true;
            }
        }
        return false;
    }

    private Map<String, Object> createErrorMap(String errorMessage) {
        Map<String, Object> errorMap = new HashMap<>();
        errorMap.put("error", errorMessage);
        return errorMap;
    }
}
