import _ from 'lodash'
import React, {Component} from 'react'
import {connect} from 'react-redux'
import classNames from 'classnames';

// components
import GeneratorDashboard from 'components/GeneratorDashboard/GeneratorDashboard';
import PopupCover from 'components/PopupCover/PopupCover';
import GeneratorSignature from 'components/GeneratorSignature/GeneratorSignature';
import GeneratorDashboardSkeleton from 'components/GeneratorDashboardSkeleton/GeneratorDashboardSkeleton';

// helpers
import {setHeightAndWidth} from 'services/CanvasImageService'
import helpers from 'helpers/helpers'

// constants
import colors from 'constants/colors'
import globalConstants from 'constants/global'

// actions
import { updateMemeRating } from 'actions/meme-actions/meme-actions';

// assets
import watemarkDesktop from 'assets/images/watermark-desktop.jpg';
import watermarkMobile from 'assets/images/watermark-mobile.jpg';

function getDataUri(url, dontPerformConversion, callback) {

    if (dontPerformConversion) {
        callback(url)
    }

    const image = new Image();

    image.onload = function () {
        const canvas = document.createElement('canvas')
        canvas.width = this.naturalWidth // or 'width' if you want a special/scaled size
        canvas.height = this.naturalHeight // or 'height' if you want a special/scaled size

        canvas.getContext('2d').drawImage(this, 0, 0)

        callback(canvas.toDataURL('image/png'))
    }

    image.crossOrigin = ''
    image.src = url + '?123'
}


class Generator extends Component {

    state = {
        isLoading: true,
        canvas: null,
        isCanvasReady: false,
    }

    componentDidMount() {
        const canvas = new fabric.Canvas('c', { allowTouchScrolling: true })
        this.setState({ canvas }, () => {
            this.createBoard(this.props.format);
            this.disableWindowScrollOnDrag(canvas);
        })
    }

    componentWillReceiveProps(nextProps) {

        if ((this.props.format !== nextProps.format) || (this.props.meme !== nextProps.meme)) {
            this.setState({ isCanvasReady: false }, () => {
                this.createBoard(nextProps.format)
            })
        }
    }

    disableWindowScrollOnDrag = (canvas) => {

        canvas.on('mouse:down', function() {
            document.querySelector(".generator").style.overflow = 'visible';
            document.querySelector("body").style.overflow = 'visible';

        });
        canvas.on('mouse:up', function() {
            document.querySelector(".generator").style.overflow = 'scroll';
            document.querySelector("body").style.overflow = 'scroll';

        });
    }

    createBoard = (wantedFormat) => {
        if (this.props.type === 'clean-slate') {
            this.createCleanSlate()
        } else {
            if (this.state.canvas) {
                this.addImage(wantedFormat)
            }
        }
    }

    createCleanSlate = () => {
        this.setState({ isLoading: false, isCanvasReady: true })
        const { canvas } = this.state
        const DISTANCE = helpers.isMobile() ? 30 : 140
        const width = document.querySelector('.generator__canvas-wrapper').offsetWidth - DISTANCE
        const height = helpers.isMobile() ? 260 : 430
        canvas.backgroundColor = colors.WHITE
        canvas.setWidth(width)
        canvas.setHeight(height)
    }

    addImage = (format) => {
        const { urlPath } = this.props.meme || {}
        const { canvas } = this.state
        const isNormalFormat = (format === globalConstants.format.normal);
        const spaceToADDForDankFormatStyle = helpers.isMobile() ? 120 : 150
        const canvasContainerWidth = document.querySelector('.generator__canvas-wrapper').offsetWidth - 200

        canvas.backgroundColor = colors.GRAY_LIGHT
        canvas.setWidth(canvasContainerWidth );
        canvas.clear()


        getDataUri(urlPath, this.props.isFromUpload, (dataUri) => {

            fabric.Image.fromURL(dataUri, image => {

                this.setState({ isLoading: false });

                image = setHeightAndWidth(image, null, null, isNormalFormat);

                canvas.setHeight(isNormalFormat ? image.height : image.height + spaceToADDForDankFormatStyle);
                canvas.setWidth( isNormalFormat ? image.width : image.width + 25);
                image.top = isNormalFormat ? 0 : (spaceToADDForDankFormatStyle - 15);
                image.left = isNormalFormat ? 0 : (10);
                canvas.backgroundColor = colors.WHITE;
                canvas.add(image)

                image.set({
                    hoverCursor: "default",
                    lockMovementX: isNormalFormat,
                    lockMovementY: isNormalFormat,
                    lockScalingX: isNormalFormat,
                    lockScalingY: isNormalFormat,
                    lockUniScaling: isNormalFormat,
                    hasBorders: !isNormalFormat,
                    selectable: true,

                })

                this.setState({ isCanvasReady: true });
                this.addWaterMark();
            })
        })

    }

    addWaterMark = () => {

        const { canvas } = this.state
        const watermark = helpers.isMobile() ? watermarkMobile : watemarkDesktop
        fabric.Image.fromURL(watermark, watermark => {

            canvas.add(watermark)

            const mobilePosition = {
                left: 0,
                top: canvas.height - 6,
                width: 50, height: 6,
                opacity: 0.5
            }

            const desktopPosition = {
                left: 0,
                top: canvas.height - 12,
                width: 99, height: 12,
                opacity: 0.5
            }

            const currentNeededPosition = (helpers.isMobile() ? mobilePosition : desktopPosition)

            watermark.set({
                lockMovementX: true,
                lockMovementY: true,
                ...currentNeededPosition
            })

            canvas.bringToFront(watermark)
            canvas.renderAll()
        })
    }


    closeGenerator = () => {
        const memeCategory = _.get(this.props, 'category')
        const wantedPath = memeCategory ? `/memes/${memeCategory}` : `/`
        this.props.history.push(wantedPath)
        document.querySelector(".cover").style.display = 'none'
    }

    render(){
        const { isLoading, isCanvasReady, canvas } = this.state;
        const { meme, format, history, location, type } = this.props;

        const generatorDashboardPosition = ( (isCanvasReady && helpers.isMobile()) ? `${_.get(this.canvasWrapper, 'offsetHeight')}px` : null)
        const dashboardStyle = generatorDashboardPosition ? {top: generatorDashboardPosition} : {};

        return (
            <PopupCover>
                <div className="generator" key="1">

                    <h1 className="text-center generator__title">
                        מחולל הממים
                    </h1>

                    <div className="generator__wrapper">

                        <div  className={classNames({ 'with-shadow' : isCanvasReady }, "generator__canvas-wrapper col-xs-12 col-sm-7")} ref={node => this.canvasWrapper = node}>
                            <canvas id='c' dir="rtl"/>
                            {isLoading && <div className="spinner">Loading&</div>}
                        </div>
                        {isCanvasReady
                            ?

                            <GeneratorDashboard
                                history={history}
                                style={dashboardStyle}
                                type={type}
                                location={location}
                                meme={meme}
                                format={format}
                                isCanvasReady={isCanvasReady}
                                canvas={canvas}
                                updateMemeRating={this.props.updateMemeRating}
                            />
                            :

                            <GeneratorDashboardSkeleton />
                        }


                    </div>

                    <div className="generator__close glyphicon glyphicon-remove"
                         onClick={this.closeGenerator}
                    />

                    <GeneratorSignature className="hidden-xs" />


                </div>

            </PopupCover>
        )

    }
}


function mapStateToProps(state, ownProps) {

    const { match: { params }, location, history } = ownProps;

    const memeId = params.id;
    const isFromUpload = (_.get(location, 'state.from') === 'upload');
    const isFromSearch = (_.get(location, 'state.from') === 'search')
    const currentMemeObj = (isFromUpload || isFromSearch) ?
        {
            urlPath: location.state.urlPath,
            id: helpers.uniqueId()
        }
        :
        state.category.memes[params.id];


    return {
        category: params.category,
        meme: currentMemeObj,
        format: params.format,
        type: params.type,
        memeId: memeId,
        history,
        location,
        isFromUpload,
        isFromSearch
    }
}

function mapDispatchToProps(dispatch) {

    return {
        updateMemeRating: (meme) => dispatch(updateMemeRating(meme)),
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Generator)