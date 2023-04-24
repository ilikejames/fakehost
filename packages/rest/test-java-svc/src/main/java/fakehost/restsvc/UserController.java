package fakehost.restsvc;

import fakehost.restsvc.entities.Me;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/user")
public class UserController {

    @ApiResponse(responseCode = "200", content = @Content(mediaType = "application/json", schema = @Schema(implementation =  Me.class)))
    @GetMapping("/me")
    public Me me() {
        return new Me("java-user");
    }
}
