package errors

import (
	"context"
	"encoding/json"
	"net/http"
)

func EncodeError(_ context.Context, err error, w http.ResponseWriter) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	
	if err.Error() == "rate limit exceeded" || err.Error() == "service busy (storage pressure)" {
		w.WriteHeader(http.StatusServiceUnavailable) // 503
	} else {
		w.WriteHeader(http.StatusInternalServerError) // 500
	}
    
	json.NewEncoder(w).Encode(map[string]string{
		"error": err.Error(),
	})
}