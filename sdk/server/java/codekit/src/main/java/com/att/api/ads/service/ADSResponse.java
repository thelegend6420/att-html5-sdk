/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4 */

/*
 * ====================================================================
 * LICENSE: Licensed by AT&T under the 'Software Development Kit Tools
 * Agreement.' 2013.
 * TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTIONS:
 * http://developer.att.com/sdk_agreement/
 *
 * Copyright 2013 AT&T Intellectual Property. All rights reserved.
 * For more information contact developer.support@att.com
 * ====================================================================
 */

package com.att.api.ads.service;

import org.json.JSONObject;

/**
 * Immutable class used to hold an ads api response.
 *
 * @author pk9069
 * @version 1.0
 * @since 1.0
 * @see <a href="https://developer.att.com/docs/apis/rest/1/Advertising">Advertising Documentation</a>
 */
public final class ADSResponse {

    /** Advertisement Click url. */
    private final String clickUrl;

    /** Advertisement type. */
    private final String type;

    /** Advertisement image url. */
    private final String imageUrl;

    /** Advertisement track url. */
    private final String trackUrl;

    /** Advertisement content. */
    private final String content;

    /**
     * Creates object to wrap an advertisement response.
     *
     * @param clickUrl click url
     * @param type type
     * @param imageUrl image url
     * @param trackUrl track url
     * @param content content
     */
    public ADSResponse(String clickUrl, String type, String imageUrl,
            String trackUrl, String content) {

        this.clickUrl = clickUrl;
        this.type = type;
        this.imageUrl = imageUrl;
        this.trackUrl = trackUrl;
        this.content = content;
    }

    /**
     * Gets ad click url.
     *
     * @return click url
     */
    public String getClickUrl() {
        return clickUrl;
    }

    /**
     * Gets ad type.
     *
     * @return ad type
     */
    public String getType() {
        return type;
    }

    /**
     * Gets ad image url, if any.
     *
     * @return ad image or null
     */
    public String getImageUrl() {
        return imageUrl;
    }

    /**
     * Gets ad track url, if any.
     *
     * @return ad track url or null
     */
    public String getTrackUrl() {
        return trackUrl;
    }

    /**
     * Gets ad content, if any.
     *
     * @return ad content or null
     */
    public String getContent() {
        return content;
    }

    public static ADSResponse valueOf(JSONObject jobj) {
        JSONObject adsResponse = jobj.getJSONObject("AdsResponse");
        JSONObject ads = adsResponse.getJSONObject("Ads");

        // required
        String type = ads.getString("Type");
        String clickUrl = ads.getString("ClickUrl");

        // optional
        String imgUrl = ads.has("ImageUrl") ? ads.getString("ImageUrl") : null;
        String tUrl = ads.has("TrackUrl") ? ads.getString("TrackUrl") : null;
        String content = ads.has("Content") ? ads.getString("Content") : null; 

        return new ADSResponse(clickUrl, type, imgUrl, tUrl, content);
    }

}
