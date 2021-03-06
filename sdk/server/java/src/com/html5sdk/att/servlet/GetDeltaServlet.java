package com.html5sdk.att.servlet;

import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.att.api.immn.service.IMMNService;
import com.att.api.oauth.OAuthToken;
import com.att.api.rest.RESTException;
import com.html5sdk.att.AttConstants;
import com.html5sdk.att.provider.ApiRequestException;

public class GetDeltaServlet extends ServiceServletBase {
    private static final long serialVersionUID = 1L;

    public GetDeltaServlet() {
        super();
    }

    @Override
    protected void doGet(HttpServletRequest request,
            HttpServletResponse response) throws ServletException, IOException {

        executeMatchingAction(request, response,
                new Action[] { new GetDeltaAction() });
    }

    class GetDeltaAction implements Action {

        public boolean match(HttpServletRequest request) {
            return true; // matches all paths for this servlet
        }

        public void handleException(Exception e, HttpServletResponse response) {
            submitJsonResponseFromException(e, response);
        }

        public void execute(HttpServletRequest request,
                HttpServletResponse response) throws ApiRequestException,
                RESTException, IOException {

            String state = getRequiredParameter(request, "state");

            OAuthToken token = SessionUtils.getTokenForScope(
                    request.getSession(), "MIM");

            if (token == null) {
                throw new AttAuthorizationException(
                        "app not authorized by user");
            }

            IMMNService svc = new IMMNService(AttConstants.HOST, token);
            String jsonResult = svc.getDeltaAndReturnRawJson(state);
            submitJsonResponseFromJsonResult(jsonResult, response);
        }
    }
}
