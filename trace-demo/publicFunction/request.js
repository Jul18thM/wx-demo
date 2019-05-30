class request{
    /**
     * GET类型的网络请求
     */
    getRequest(url, data, header) {
        return this.requestAll(url, data, header, 'GET',)
    }

    /**
     * DELETE类型的网络请求
     */
    deleteRequest(url, data, header) {
        return this.requestAll(url, data, header, 'DELETE')
    }

    /**
     * PUT类型的网络请求
     */
    putRequest(url, data, header) {
        return this.requestAll(url, data, header, 'PUT')
    }

    /**
     * POST类型的网络请求
     */
    postRequest(url, data, header) {
        return this.requestAll(url, data, header, 'POST')
    }

    requestAll(url, data, header, method) {
        return new Promise((resolve) => {
            wx.request({
                url: url,
                data: data,
                header: header,
                method: method,
                success: (res => {
                    if (res.statusCode === 200) {
                        if(res.data.code === '401'){
                            app.refreshToken(this.requestAll(url, data, header, method));
                        }else if(res.data.code === '000000'){
                            //200: 服务端业务处理正常结束
                            resolve(res);
                        }else{
                            wx.showToast({
                                title: res.data.message,
                                icon:'none'
                            })
                        }
                    } else {
                        //其它错误，提示用户错误信息
                        if (this._errorHandler != null) {
                        //如果有统一的异常处理，就先调用统一异常处理函数对异常进行处理
                          this._errorHandler(res)
                        }
                        reject(res)
                      }
                    }),
                fail: (res => {
                      if (this._errorHandler != null) {
                        this._errorHandler(res)
                      }
                      reject(res)
                })
             })
        })
    }
}


export default request;