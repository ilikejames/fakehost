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
import org.springframework.web.multipart.MultipartHttpServletRequest;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;


@RestController
@RequestMapping("/orders")
public class OrderController {

    private static final Gson gson = new Gson();
    private static final AtomicInteger idCounter = new AtomicInteger(1);
    private static final String[] allowedSymbols = new String[]{"AAPL", "TSLA", "GME"};

    // The typescript generator does not support multiple content-types for the endpoint
    // and will just choose the first. Therefore, splitting out the endpoints for the
    // different content-types to contract test each.
    @Operation(summary = "Place an order from a form", description = "Places an order with the given symbol, quantity, and side")
    @ApiResponse(responseCode = "201", description = "Order placed successfully", content = @Content(mediaType = "application/json", schema = @Schema(implementation =  Order.class)))
    @ApiResponse(responseCode = "400", description = "Invalid input")
    @PostMapping(path = "/form", consumes = {"application/x-www-form-urlencoded"})
    public ResponseEntity<Map<String, Object>> placeOrderForm(@ModelAttribute @RequestBody NewOrder order) {
        return this.placeOrder(order);
    }

    @Operation(summary = "Place an order using FormData", description = "Places an order with the given symbol, quantity, and side")
    @ApiResponse(responseCode = "201", description = "Order placed successfully", content = @Content(mediaType = "application/json", schema = @Schema(implementation =  Order.class)))
    @ApiResponse(responseCode = "400", description = "Invalid input")
    @PostMapping(path = "/form-data", consumes = {"multipart/form-data"})
    public ResponseEntity<Map<String, Object>> placeOrderFormData(
        MultipartHttpServletRequest request
    ) {
        String symbol = request.getParameter("symbol");
        Integer quantity = Integer.valueOf(request.getParameter("quantity"));
        OrderSide side = OrderSide.valueOf(request.getParameter("side"));

        var newOrder = new NewOrder();
        newOrder.setQuantity(quantity);
        newOrder.setSide(side);
        newOrder.setSymbol(symbol);
        System.out.println("Received order: " + newOrder);
        return this.placeOrder(newOrder);
    }

    @Operation(summary = "Place an order using json", description = "Places an order with the given symbol, quantity, and side")
    @ApiResponse(responseCode = "201", description = "Order placed successfully", content = @Content(mediaType = "application/json", schema = @Schema(implementation =  Order.class)))
    @ApiResponse(responseCode = "400", description = "Invalid input")
    @PostMapping(path = "/json", consumes = {"application/json"})
    public ResponseEntity<Map<String, Object>> placeOrderJson(@RequestBody NewOrder order) {
        System.out.println("Received order: " + order);
        return this.placeOrder(order);
    }

    private ResponseEntity<Map<String, Object>> placeOrder(NewOrder order) {
        if (!isValidSymbol(order.getSymbol())) {
            var error = new ErrorResponse("Unknown symbol: " + order.getSymbol());
            return new ResponseEntity(gson.toJson(error), HttpStatus.BAD_REQUEST);
        }

        if (order.getQuantity() <= 0) {
            var error = new ErrorResponse("Quantity should be greater than zero");
            return new ResponseEntity(gson.toJson(error), HttpStatus.BAD_REQUEST);
        }

        var createdOrder = new Order();
        createdOrder.setId(idCounter.getAndIncrement());
        createdOrder.setQuantity(order.getQuantity());
        createdOrder.setSide(order.getSide());
        createdOrder.setSymbol(order.getSymbol());

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
