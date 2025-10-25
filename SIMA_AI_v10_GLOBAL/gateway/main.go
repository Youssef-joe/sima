package main
import ("net/http"; "log"; "io"; "os")
func main(){
    api := os.Getenv("API_URL")
    if api == "" { api = "http://api:8080" }
    http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request){
        if r.URL.Path == "/" { w.Write([]byte("SIMA Gateway up")); return }
        resp, err := http.Get(api + r.URL.Path)
        if err != nil { http.Error(w, err.Error(), 502); return }
        defer resp.Body.Close()
        for k, v := range resp.Header { w.Header().Set(k, v[0]) }
        w.WriteHeader(resp.StatusCode)
        io.Copy(w, resp.Body)
    })
    log.Println("Gateway on :8081 ->", api)
    log.Fatal(http.ListenAndServe(":8081", nil))
}
